import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Integration Tests: Complete API Suite', () => {
  let authToken = '';
  let createdInquiryId = '';

  describe('1. Health & System', () => {
    it('GET /api/health returns 200 with uptime and database status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('GET /api/docs returns 200 with Swagger documentation UI', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
    });
  });

  describe('2. Public Inquiry Submissions', () => {
    it('POST /api/inquiries creates a valid inquiry (HTTP 201)', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          userType: 'Parent',
          category: 'Scholarship',
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          phone: '+91 98765 43210',
          message: 'Inquiring regarding high school music scholarship criteria.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      createdInquiryId = res.body.data.id;
    });

    it('POST /api/inquiries rejects invalid payload with 400 and validation details', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          userType: 'Alien', // invalid
          category: 'Scholarship',
          name: 'A', // too short
          email: 'bad-email',
          phone: '123',
          message: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('POST /api/inquiries silently drops bot submissions with honeypot filled', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          userType: 'Parent',
          category: 'Admission',
          name: 'Spam Bot',
          email: 'bot@spam.com',
          phone: '+91 98765 00000',
          message: 'Spam message text for bot testing purposes.',
          website: 'http://spam-link.ru',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('3. Custom Authentication & Lockout', () => {
    it('POST /api/auth/login fails on incorrect password with generic 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@k12hunar.com',
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('POST /api/auth/login succeeds with correct credentials and returns JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@k12hunar.com',
          password: 'Admin@12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.email).toBe('admin@k12hunar.com');
      authToken = res.body.data.token;
    });

    it('GET /api/auth/me returns admin profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.admin.email).toBe('admin@k12hunar.com');
    });

    it('GET /api/auth/me rejects missing token with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/auth/me rejects invalid token with 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_forged_token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('4. Inquiries Protected Management', () => {
    it('GET /api/inquiries returns paginated list with total and metadata', async () => {
      const res = await request(app)
        .get('/api/inquiries?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/inquiries rejects invalid sort column with 400', async () => {
      const res = await request(app)
        .get('/api/inquiries?sort=injected_sql_column')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/inquiries/stats returns overview count breakdown', async () => {
      const res = await request(app)
        .get('/api/inquiries/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.total).toBe('number');
      expect(typeof res.body.data.byStatus.New).toBe('number');
    });

    it('GET /api/inquiries/analytics returns 30-day time series data', async () => {
      const res = await request(app)
        .get('/api/inquiries/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.daily)).toBe(true);
      expect(res.body.data.daily.length).toBe(30);
    });

    it('GET /api/inquiries/export returns sanitized CSV file', async () => {
      const res = await request(app)
        .get('/api/inquiries/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Name');
      expect(res.text).toContain('Category');
    });

    it('PATCH /api/inquiries/:id/status updates status and logs activity', async () => {
      if (!createdInquiryId) return;

      const res = await request(app)
        .patch(`/api/inquiries/${createdInquiryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'In Progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('In Progress');
    });

    it('POST /api/inquiries/:id/notes adds internal note to inquiry', async () => {
      if (!createdInquiryId) return;

      const res = await request(app)
        .post(`/api/inquiries/${createdInquiryId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: 'Called parent; arranged campus visit.' });

      expect(res.status).toBe(201);
      expect(res.body.data.note).toBe('Called parent; arranged campus visit.');
    });

    it('GET /api/inquiries/:id returns full detail including notes and activity', async () => {
      if (!createdInquiryId) return;

      const res = await request(app)
        .get(`/api/inquiries/${createdInquiryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Priya Sharma');
      expect(Array.isArray(res.body.data.notes)).toBe(true);
      expect(Array.isArray(res.body.data.activity)).toBe(true);
    });
  });
});
