const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const trackOut = path.resolve(__dirname, 'docs', 'screenshots', 'home-after', 'track-hyperthread.png');
const inquiryOut = path.resolve(__dirname, 'docs', 'screenshots', 'home-after', 'inquiry-hyperthread.png');

try {
  console.log('Capturing track page...');
  execFileSync(chromePath, [
    '--headless=new',
    `--screenshot=${trackOut}`,
    '--window-size=1440,900',
    '--hide-scrollbars',
    'http://localhost:5173/track'
  ], { timeout: 15000 });
  console.log('Track screenshot exists:', fs.existsSync(trackOut));

  console.log('Capturing inquiry page...');
  execFileSync(chromePath, [
    '--headless=new',
    `--screenshot=${inquiryOut}`,
    '--window-size=1440,1100',
    '--hide-scrollbars',
    'http://localhost:5173/inquiry'
  ], { timeout: 15000 });
  console.log('Inquiry screenshot exists:', fs.existsSync(inquiryOut));
} catch (e) {
  console.error('Capture error:', e.message);
}
