import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const programsFile = path.resolve(__dirname, '../src/features/home/programs.ts');
const content = fs.readFileSync(programsFile, 'utf-8');

// Extract slugs and officialUrls from programs.ts
const programMatches = [...content.matchAll(/slug:\s*['"]([^'"]+)['"][\s\S]*?officialUrl:\s*['"]([^'"]+)['"]/g)];
const RAW_PROGRAMS = programMatches.map((m) => ({
  slug: m[1],
  officialUrl: m[2],
  title: m[1],
}));

console.log('=== K12 Hunar Official Link Health Checker ===');
console.log(`Checking ${RAW_PROGRAMS.length} official event URLs...\n`);

const USER_AGENT = 'K12Hunar-LinkChecker/1.0 (+https://k12hunar.com; polite-health-check)';

async function checkUrl(urlStr, title) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': USER_AGENT,
            Accept: '*/*',
          },
          timeout: 10000,
        },
        (res) => {
          resolve({
            url: urlStr,
            title,
            status: res.statusCode,
            ok: (res.statusCode >= 200 && res.statusCode < 400),
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url: urlStr,
          title,
          status: 'TIMEOUT',
          ok: false,
          warning: 'Request timed out after 10s',
        });
      });

      req.on('error', (err) => {
        resolve({
          url: urlStr,
          title,
          status: 'ERR',
          ok: false,
          warning: err.message,
        });
      });

      req.end();
    } catch (err) {
      resolve({
        url: urlStr,
        title,
        status: 'PARSE_ERR',
        ok: false,
        warning: err.message,
      });
    }
  });
}

async function run() {
  for (const prog of RAW_PROGRAMS) {
    const result = await checkUrl(prog.officialUrl, prog.title);
    if (result.ok) {
      console.log(`[PASS] ${result.status} | ${prog.slug} -> ${result.url}`);
    } else {
      console.warn(`[WARN] ${result.status} | ${prog.slug} -> ${result.url} (${result.warning || 'Status ' + result.status})`);
    }
  }

  console.log('\nLink check completed. Exiting 0 (warn-only policy).');
  process.exit(0);
}

run();
