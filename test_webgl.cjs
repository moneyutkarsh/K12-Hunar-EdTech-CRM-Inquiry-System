const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const trackOut = path.resolve(__dirname, 'docs', 'screenshots', 'home-after', 'track-hyperthread.png');
const inquiryOut = path.resolve(__dirname, 'docs', 'screenshots', 'home-after', 'inquiry-hyperthread.png');

try {
  execFileSync(chromePath, [
    '--headless=new',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,900',
    '--hide-scrollbars',
    `--screenshot=${trackOut}`,
    'http://localhost:5173/track'
  ], { timeout: 15000 });
  console.log('Track size:', fs.statSync(trackOut).size);

  execFileSync(chromePath, [
    '--headless=new',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1440,1100',
    '--hide-scrollbars',
    `--screenshot=${inquiryOut}`,
    'http://localhost:5173/inquiry'
  ], { timeout: 15000 });
  console.log('Inquiry size:', fs.statSync(inquiryOut).size);
} catch (e) {
  console.error(e.message);
}
