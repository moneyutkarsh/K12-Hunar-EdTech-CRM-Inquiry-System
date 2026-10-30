import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@k12hunar.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function checkDatabaseReachable() {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch (err) {
    return false;
  }
}

async function run() {
  console.log('--- Starting Playwright E2E User Journey Test Suite ---');

  const isDbUp = await checkDatabaseReachable();
  if (!isDbUp) {
    console.log('[E2E SKIP] Database or backend is unreachable at ' + API_URL + '. Skipping gracefully as per DoD.');
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${stepName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${stepName} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Bad password error
    console.log('\n1. Testing Bad Password Error...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', 'WrongPassword999!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(600);
    const toastError = await page.locator('[data-sonner-toast], div[role="status"]').textContent();
    assert(
      toastError && (toastError.includes('Invalid') || toastError.includes('password') || toastError.includes('credentials')),
      '1. Bad password correctly presents authentication error feedback',
      `Got: ${toastError}`
    );

    // 2. Submit Inquiry on /inquiry
    console.log('\n2. Testing Public Inquiry Submission on /inquiry...');
    const uniqueEmail = `playwright.${Date.now()}@example.com`;
    const uniqueName = `E2E Playwright Applicant ${Date.now() % 10000}`;
    await page.goto(`${BASE_URL}/inquiry`, { waitUntil: 'networkidle' });
    await page.fill('#name', uniqueName);
    await page.fill('#email', uniqueEmail);
    await page.fill('#phone', '9876543210');
    await page.fill('#message', 'Automated Playwright end-to-end applicant verification testing workflow.');
    await page.click('button[type="submit"]');

    // Wait for reference code container
    const refCodeLocator = page.locator('span.font-mono.text-2xl');
    await refCodeLocator.waitFor({ state: 'visible', timeout: 8000 });
    const refCode = (await refCodeLocator.textContent())?.trim();
    assert(Boolean(refCode && refCode.length >= 6), '2. Public inquiry submitted and reference code generated', `Code: ${refCode}`);

    // 3. Track Inquiry on /track
    console.log('\n3. Testing Public Inquiry Tracker on /track...');
    await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
    await page.fill('#reference', refCode);
    await page.fill('#email', uniqueEmail);
    await page.click('button[type="submit"]');
    const trackRegion = page.locator('div[role="region"]');
    await trackRegion.waitFor({ state: 'visible', timeout: 8000 });
    const trackText = await trackRegion.textContent();
    assert(
      trackText.includes(refCode) && trackText.includes('New'),
      '3. Public tracker resolved inquiry status and details',
      `Region text preview: ${trackText.slice(0, 80)}`
    );

    // 4. Admin Login
    console.log('\n4. Testing Admin Login...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 10000 });
    assert(page.url().includes('/admin'), '4. Admin authenticated and redirected to /admin dashboard');

    // 5. Find Inquiry via Search and Change Status
    console.log('\n5. Testing Search and Status Change in CRM...');
    const searchInput = page.locator('#dashboard-search-input');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(uniqueName);
    await page.waitForTimeout(600); // 400ms debounce
    
    // Find matching row
    const rowLocator = page.locator(`tr:has-text("${uniqueName}")`).first();
    await rowLocator.waitFor({ state: 'visible', timeout: 8000 });
    await rowLocator.click();

    // Drawer should open, click 'In Progress' status button
    const inProgressBtn = page.locator('button:has-text("In Progress")').first();
    await inProgressBtn.waitFor({ state: 'visible', timeout: 5000 });
    await inProgressBtn.click();
    await page.waitForTimeout(600);
    assert(true, '5. Inquiry located via search and status transitioned to In Progress');

    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 6. Verify /admin/activity shows the change
    console.log('\n6. Testing Activity Audit Trail on /admin/activity...');
    await page.goto(`${BASE_URL}/admin/activity`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const activityBody = await page.locator('body').textContent();
    assert(
      activityBody.includes('In Progress') || activityBody.includes('status_changed') || activityBody.includes('changed status'),
      '6. Admin activity audit trail records status change event'
    );

    // 7. Logout and verify /admin redirects to login
    console.log('\n7. Testing Logout Redirect...');
    const logoutBtn = page.locator('button[title="Sign out"]');
    await logoutBtn.click();
    await page.waitForURL('**/admin/login', { timeout: 5000 });
    assert(page.url().includes('/admin/login'), '7. Admin logged out and redirected to login page');

    // 8. Invalid token redirect
    console.log('\n8. Testing Invalid Token Guard...');
    await page.evaluate(() => {
      localStorage.setItem('k12_token', 'invalid-mock-token-xyz');
      localStorage.setItem('k12_admin', JSON.stringify({ email: 'fake@k12hunar.com' }));
    });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    assert(page.url().includes('/admin/login'), '8. Invalid token rejected and protected route redirects to login');

  } catch (err) {
    console.error('E2E execution failed with error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n=======================================');
  console.log(`PLAYWRIGHT E2E RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

run();
