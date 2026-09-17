// Reproduction for the production "Maximum update depth" (React #185) crash on
// /dashboard (Sep 15 2026): its top stack frame is the radar chart's `storage`
// listener. Fires bursts of cross-tab-style storage events at the dashboard
// and fails if React's loop guard (or any page error) trips.
// Run: node e2e/harness/storage-storm-check.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 4331;
const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true, open: false } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

let failed = false;
try {
  await page.addInitScript(() => {
    try { localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 })); } catch {}
  });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: /demo/i }).first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2500);

  for (const burst of [10, 60, 300]) {
    errors.length = 0;
    // Same task, back to back: what another tab's sync restore looks like here.
    await page.evaluate((n) => {
      for (let i = 0; i < n; i++) window.dispatchEvent(new StorageEvent('storage', { key: `storm-${i}`, newValue: String(i) }));
    }, burst);
    await page.waitForTimeout(2000);
    const loop = errors.filter((m) => /Maximum update depth|#185/.test(m)).length;
    const alive = await page.locator('main, [data-sidebar]').first().isVisible().catch(() => false);
    console.log(`burst ${burst}: page errors ${errors.length}, loop-guard errors ${loop}, app still rendered: ${alive}`);
    if (errors.length) console.log('   first:', errors[0]);
    if (loop || !alive) failed = true;
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(failed ? 'FAIL: storage burst crashes the dashboard' : 'PASS: dashboard survives storage bursts');
process.exit(failed ? 1 : 0);
