import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';
const BASELINE_DIR = path.resolve('docs/screenshots/release-baseline');
const CURRENT_DIR = path.resolve('docs/screenshots/release-current');
const DIFF_DIR = path.resolve('docs/screenshots/release-diff');

[CURRENT_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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
  console.log('Running visual comparison against baseline (threshold: 0.1%)...\n');
  let overallPassed = true;

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

      const currentImgName = `${r.name}-${vp.name}.png`;
      const currentPath = path.join(CURRENT_DIR, currentImgName);
      const baselinePath = path.join(BASELINE_DIR, currentImgName);
      const diffPath = path.join(DIFF_DIR, currentImgName);

      await page.screenshot({ path: currentPath, fullPage: true });

      if (!fs.existsSync(baselinePath)) {
        console.error(`  FAIL: Missing baseline image for ${currentImgName}`);
        overallPassed = false;
        continue;
      }

      const imgBaseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const imgCurrent = PNG.sync.read(fs.readFileSync(currentPath));

      const width = Math.min(imgBaseline.width, imgCurrent.width);
      const height = Math.min(imgBaseline.height, imgCurrent.height);

      const diff = new PNG({ width, height });
      const numDiffPixels = pixelmatch(
        imgBaseline.data,
        imgCurrent.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );

      const totalPixels = width * height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      const isPass = diffPercentage <= 0.1;
      const statusIcon = isPass ? '? PASS' : '? FAIL';
      console.log(`  ${statusIcon} [${vp.name}px] ${r.name}: ${diffPercentage.toFixed(4)}% diff (${numDiffPixels} / ${totalPixels} px)`);

      if (!isPass) overallPassed = false;
    }

    await context.close();
  }

  await browser.close();

  if (!overallPassed) {
    console.error('\nVisual regression check FAILED: one or more routes exceeded 0.1% diff threshold.');
    process.exit(1);
  } else {
    console.log('\n? Visual regression check PASSED: all routes within 0.1% diff threshold.');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Visual check error:', err);
  process.exit(1);
});
