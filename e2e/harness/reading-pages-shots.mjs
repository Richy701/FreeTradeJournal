// Screenshots of the long-form reading pages at desktop and phone widths.
// Run: OUT=/some/dir node e2e/harness/reading-pages-shots.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.OUT || path.join(ROOT, 'e2e/harness/out/reading-pages');
const ROUTES = (process.env.ROUTES || '/privacy,/terms,/cookie-policy').split(',');
mkdirSync(OUT, { recursive: true });
const server = await preview({ root: ROOT, preview: { port: 4334, strictPort: true, open: false } });
const browser = await chromium.launch();
try {
  for (const [label, viewport] of [['1440', { width: 1440, height: 900 }], ['1920', { width: 1920, height: 1080 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, colorScheme: 'dark' });
    await page.addInitScript(() => {
      try { localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 })); } catch {}
    });
    for (const route of ROUTES) {
      await page.goto(`http://localhost:4334${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${route.slice(1)}-${label}.png`) });
      if (label === '1440') {
        await page.evaluate(() => window.scrollTo(0, 1600));
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${route.slice(1)}-${label}-scrolled.png`) });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log('screenshots in', OUT);
