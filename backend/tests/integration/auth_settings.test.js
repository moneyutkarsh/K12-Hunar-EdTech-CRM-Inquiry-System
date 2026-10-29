import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { query } from '../../src/config/db.js';

describe('Auth Settings & Session Revocation Integration Tests', () => {
  let authToken = '';
  let adminId = '';
  const testEmail = 'settings_test@k12hunar.com';
  const initialPassword = 'Password123!';
  const updatedPassword = 'NewSecretPassword99!';

  beforeAll(async () => {
    // Clean up test admin if exists
    await query(`DELETE FROM admins WHERE email = $1`, [testEmail]);

    // Create test admin
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: initialPassword });

    expect(signupRes.status).toBe(201);
    authToken = signupRes.body.token;
    adminId = signupRes.body.admin.id;
  });

  it('1. GET /api/auth/me returns admin profile and tokenVersion', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.admin).toBeDefined();
    expect(res.body.data.admin.email).toBe(testEmail);
    expect(res.body.data.admin.tokenVersion).toBe(1);
  });

  it('2. PATCH /api/auth/password fails with incorrect current password', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'WrongPassword!',
        newPassword: updatedPassword,
      });

    expect(res.status).toBe(400);
  });

  it('3. PATCH /api/auth/password fails if new password does not meet complexity', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: initialPassword,
        newPassword: 'simple',
      });

    expect(res.status).toBe(400);
  });

  it('4. PATCH /api/auth/password succeeds with valid passwords and returns fresh token', async () => {
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.tokenVersion).toBe(2);

    // Old token should now be REVOKED (token_version mismatch)
    const oldTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(oldTokenRes.status).toBe(401);
    expect(oldTokenRes.body.error.code).toBe('REVOKED_TOKEN');

    // New token works
    const newTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(newTokenRes.status).toBe(200);
    expect(newTokenRes.body.data.admin.tokenVersion).toBe(2);

    // Update authToken to the new valid token
    authToken = res.body.token;
  });

  it('5. POST /api/auth/logout-all increments tokenVersion and revokes active token', async () => {
    const res = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tokenVersion).toBe(3);

    // Now current token should be rejected with REVOKED_TOKEN
    const afterLogoutRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(afterLogoutRes.status).toBe(401);
    expect(afterLogoutRes.body.error.code).toBe('REVOKED_TOKEN');
  });

  it('6. Login with updated password succeeds with new tokenVersion', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: updatedPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.admin.tokenVersion).toBe(3);

    // Verify it works
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.admin.email).toBe(testEmail);
  });
});
