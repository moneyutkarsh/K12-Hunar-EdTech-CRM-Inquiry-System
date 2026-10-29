import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Activity Feed API Integration Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    // Login as lead admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@k12hunar.com',
        password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
      });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
  });

  it('1. GET /api/activity rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.status).toBe(401);
  });

  it('2. GET /api/activity returns cursor-paginated activity items', async () => {
    const res = await request(app)
      .get('/api/activity?limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();

    if (res.body.data.length > 0) {
      const item = res.body.data[0];
      expect(item.id).toBeDefined();
      expect(item.action).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.inquiry).toBeDefined();
      expect(item.inquiry.referenceCode).toBeDefined();
    }
  });

  it('3. GET /api/activity filters by action type', async () => {
    const res = await request(app)
      .get('/api/activity?action=status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    for (const item of res.body.data) {
      expect(item.action).toBe('status_changed');
    }
  });
});
