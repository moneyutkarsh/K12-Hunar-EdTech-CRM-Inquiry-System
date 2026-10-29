import { spawn } from 'child_process';
import http from 'http';

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsed = new URL(url);

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: `${parsed.pathname}${parsed.search}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting K12 Hunar CRM Backend End-to-End Self-Test...');

  // Start backend server in test mode
  const env = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: 'test',
    USE_MOCK_DB: 'true',
    JWT_SECRET: 'mock_secret_for_automated_testing_min_32_characters_long',
    CLIENT_URL: '*',
    ADMIN_EMAIL: 'admin@k12hunar.com',
    ADMIN_PASSWORD: 'Admin@12345',
  };

  const serverProc = spawn('node', ['src/server.js'], { env, cwd: process.cwd() });

  serverProc.stdout.on('data', (d) => process.stdout.write(`[Server] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[Server ERR] ${d}`));

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await request('/health');
      if (res.status === 200 && res.body.status === 'ok') {
        ready = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!ready) {
    console.error('❌ Server failed to start within timeout.');
    serverProc.kill();
    process.exit(1);
  }

  console.log('✅ Server is ready. Running test cases...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await request('/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'GET /api/health returns 200 { status: "ok" }');

    // 2. Public inquiry submission
    const inquiryPayload = {
      userType: 'Parent',
      category: 'Scholarship',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765-43210',
      message: 'Inquiring regarding high school STEM scholarship application eligibility and test date.',
    };
    const submitRes = await request('/inquiries', { method: 'POST', body: inquiryPayload });
    assert(submitRes.status === 201 && submitRes.body.id, 'POST /api/inquiries returns 201 with created id');
    const createdId = submitRes.body.id;

    // 3. Honeypot bot protection test
    const botRes = await request('/inquiries', {
      method: 'POST',
      body: { ...inquiryPayload, honeypot: 'spam_bot_url.com' },
    });
    assert(botRes.status === 400, 'POST /api/inquiries rejects bot submissions with honeypot filled');

    // 4. Unauthenticated access should be rejected with 401
    const unauthRes = await request('/inquiries');
    assert(unauthRes.status === 401, 'GET /api/inquiries without token returns 401 Unauthorized');

    // 5. Invalid token should be rejected with 401
    const badTokenRes = await request('/inquiries', {
      headers: { Authorization: 'Bearer this_is_a_completely_invalid_jwt_token' },
    });
    assert(badTokenRes.status === 401, 'GET /api/inquiries with invalid token returns 401');

    // 6. Admin Login with wrong credentials
    const badLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@k12hunar.com', password: 'WrongPassword999' },
    });
    assert(
      badLoginRes.status === 401 && badLoginRes.body.error?.message === 'Invalid email or password',
      'POST /api/auth/login with wrong credentials returns generic 401'
    );

    // 7. Admin Login with correct credentials
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@k12hunar.com', password: 'Admin@12345' },
    });
    assert(
      loginRes.status === 200 && loginRes.body.token && loginRes.body.admin?.email === 'admin@k12hunar.com',
      'POST /api/auth/login returns 200 with JWT token and admin info'
    );
    const token = loginRes.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 8. Protected GET /api/auth/me
    const meRes = await request('/auth/me', { headers: authHeaders });
    assert(meRes.status === 200 && meRes.body.admin?.email === 'admin@k12hunar.com', 'GET /api/auth/me returns admin profile');

    // 9. Protected GET /api/inquiries (authenticated)
    const listRes = await request('/inquiries', { headers: authHeaders });
    assert(
      listRes.status === 200 && Array.isArray(listRes.body.data) && listRes.body.pagination?.total >= 1,
      'GET /api/inquiries with valid token returns paginated results'
    );

    // 10. Filter and Search
    const searchRes = await request('/inquiries?search=Aarav', { headers: authHeaders });
    assert(
      searchRes.status === 200 && searchRes.body.data.length >= 1 && searchRes.body.data[0].name.includes('Aarav'),
      'GET /api/inquiries?search=Aarav finds inquiry by name search'
    );

    // 11. Stats aggregation
    const statsRes = await request('/inquiries/stats', { headers: authHeaders });
    assert(
      statsRes.status === 200 && typeof statsRes.body.total === 'number' && statsRes.body.new >= 1,
      'GET /api/inquiries/stats returns total, new, inProgress, resolved counts'
    );

    // 12. Update status (PATCH /api/inquiries/:id/status)
    const patchRes = await request(`/inquiries/${createdId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'In Progress' },
    });
    assert(
      patchRes.status === 200 && patchRes.body.data?.status === 'In Progress',
      'PATCH /api/inquiries/:id/status updates status to "In Progress"'
    );

    // 13. CSV Export with formula injection protection
    const exportRes = await request('/inquiries/export', { headers: authHeaders });
    assert(
      exportRes.status === 200 &&
        typeof exportRes.body === 'string' &&
        exportRes.body.includes('"Name"') &&
        exportRes.body.includes('"Email"') &&
        exportRes.body.includes('"Category"'),
      'GET /api/inquiries/export returns sanitized CSV file content'
    );

    // 14. 404 handler check
    const notFoundRes = await request('/non-existent-endpoint');
    assert(notFoundRes.status === 404 && notFoundRes.body.error?.message, 'Non-existent route returns 404 with standard error JSON');

  } finally {
    serverProc.kill();
  }

  console.log(`\n================================`);
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
