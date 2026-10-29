import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Integration Tests: Public Tracking & Stats Suite', () => {
  let createdRefCode = '';
  const testEmail = `track.test.${Date.now()}@example.com`;

  it('1. POST /api/inquiries returns referenceCode on creation', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        userType: 'Student',
        category: 'Admission',
        name: 'Arjun Verma',
        email: testEmail,
        phone: '+91 98765 11223',
        message: 'Looking for class 11 admissions and scholarship eligibility.',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.referenceCode).toMatch(/^KH-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    createdRefCode = res.body.data.referenceCode;
  });

  it('2. POST /api/track succeeds with valid reference and registered email', async () => {
    expect(createdRefCode).toBeTruthy();

    const res = await request(app)
      .post('/api/track')
      .send({
        reference: createdRefCode.toLowerCase(), // test case-insensitivity
        email: testEmail.toUpperCase(), // test case-insensitivity
      });

    expect(res.status).toBe(200);
    expect(res.body.reference).toBe(createdRefCode);
    expect(res.body.category).toBe('Admission');
    expect(res.body.status).toBe('New');
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    expect(Array.isArray(res.body.timeline)).toBe(true);
    expect(res.body.timeline.length).toBeGreaterThanOrEqual(1);
    expect(res.body.timeline[0].event).toBe('Received');

    // Security check: strictly NO sensitive PII leaked
    expect(res.body.email).toBeUndefined();
    expect(res.body.phone).toBeUndefined();
    expect(res.body.message).toBeUndefined();
    expect(res.body.notes).toBeUndefined();
    expect(res.body.id).toBeUndefined();
    expect(res.body.adminId).toBeUndefined();
  });

  it('3. POST /api/track returns generic 404 on reference code mismatch', async () => {
    const res = await request(app)
      .post('/api/track')
      .send({
        reference: 'KH-ZZZZZZZZ',
        email: testEmail,
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('No inquiry found for those details');
  });

  it('4. POST /api/track returns identical generic 404 on email mismatch', async () => {
    const res = await request(app)
      .post('/api/track')
      .send({
        reference: createdRefCode,
        email: 'wrong.person@example.com',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('No inquiry found for those details');
  });

  it('5. POST /api/track returns 400 for validation failures', async () => {
    const res = await request(app)
      .post('/api/track')
      .send({
        reference: 'AB',
        email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('6. GET /api/public/stats returns public aggregates without authentication', async () => {
    const res = await request(app).get('/api/public/stats');

    expect(res.status).toBe(200);
    expect(typeof res.body.handledApprox).toBe('number');
    expect(typeof res.body.resolvedPct).toBe('number');
    expect(typeof res.body.avgFirstResponseHours).toBe('number');
  });
});
