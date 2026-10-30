import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';
const OUT_DIR = path.resolve('docs/screenshots/release-baseline');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'inquiry', path: '/inquiry' },
  { name: 'track', path: '/track' },
  { name: 'admin-login', path: '/admin/login' },
  { name: 'admin-dashboard', path: '/admin', auth: true },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  console.log('Capturing frozen baseline screenshots for all routes...');

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    for (const r of ROUTES) {
      if (r.auth) {
        try {
          const authRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@k12hunar.com', password: 'Admin@12345' }),
          });
          if (authRes.ok) {
            const data = await authRes.json();
            const token = data.data?.token || data.token;
            const admin = data.data?.admin || data.admin;
            await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
            await page.evaluate(({ t, a }) => {
              localStorage.setItem('k12_token', t);
              localStorage.setItem('k12_admin', JSON.stringify(a));
            }, { t: token, a: admin });
          }
        } catch (e) {
          console.warn('Auth error:', e.message);
        }
      }

      const targetUrl = `${BASE_URL}${r.path}`;
      console.log(`[${vp.name}px] Navigating to ${targetUrl}...`);
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Freeze all animations, transitions, carousel auto-advance, and hide dynamic canvas elements
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.id = 'freeze-animations-for-vrt';
        style.innerHTML = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
          canvas {
            visibility: hidden !important;
          }
        `;
        document.head.appendChild(style);

        const carouselSection = document.querySelector('section[aria-label*="Featured Programs"]');
        if (carouselSection) {
          carouselSection.dispatchEvent(new MouseEvent('mouseenter'));
        }
      });

      await page.waitForTimeout(300);

      const outPath = path.join(OUT_DIR, `${r.name}-${vp.name}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`  Saved baseline: ${outPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('Baseline capture complete!');
}

run().catch(err => {
  console.error('Failed to capture baseline:', err);
  process.exit(1);
});
