#!/usr/bin/env node

/**
 * K12 Hunar CRM - Production Smoke Test Script
 * Usage:
 *   API_URL=http://localhost:5000/api ADMIN_EMAIL=admin@k12hunar.com ADMIN_PASSWORD=Admin@12345 node smoke.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@k12hunar.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

console.log('🔥 Running Production Smoke Test against:', API_URL);

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details}`);
    failed++;
  }
}

async function run() {
  try {
    // 1. Health Check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', '1. GET /health returns 200 { status: "ok" }');

    // 2. Submit Public Inquiry
    const submit = await request('/inquiries', {
      method: 'POST',
      body: {
        userType: 'Parent',
        category: 'Admission',
        name: 'Smoke Test Visitor',
        email: `smoke.${Date.now()}@example.com`,
        phone: '+91 98765 00000',
        message: 'This is an automated smoke test inquiry to verify deployed backend pipeline.',
      },
    });
    assert(submit.status === 201 && submit.data.data?.id, '2. POST /inquiries creates inquiry record');
    const createdId = submit.data.data?.id;

    // 3. Admin Login
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    assert(login.status === 200 && login.data.data?.token, '3. POST /auth/login returns JWT bearer token');
    const token = login.data.data?.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 4. List Inquiries with Filter
    const list = await request('/inquiries?limit=5', { headers: authHeaders });
    assert(list.status === 200 && Array.isArray(list.data.data), '4. GET /inquiries returns paginated list');

    // 5. Update Status
    if (createdId) {
      const update = await request(`/inquiries/${createdId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: { status: 'In Progress' },
      });
      assert(update.status === 200 && update.data.data?.status === 'In Progress', '5. PATCH /inquiries/:id/status updates status');
    }

    // 6. Check Stats
    const stats = await request('/inquiries/stats', { headers: authHeaders });
    assert(stats.status === 200 && typeof stats.data.data?.total === 'number', '6. GET /inquiries/stats returns overview counts');

    // 7. Check 30-Day Analytics
    const analytics = await request('/inquiries/analytics', { headers: authHeaders });
    assert(analytics.status === 200 && Array.isArray(analytics.data.data?.daily), '7. GET /inquiries/analytics returns 30-day series');

  } catch (err) {
    console.error('Smoke test crashed:', err);
    failed++;
  }

  console.log('\n=======================================');
  console.log(`SMOKE TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

run();
