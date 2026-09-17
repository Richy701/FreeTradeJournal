// Reproduction for the Google Translate crash (React #11538): Translate swaps
// text nodes for <font> wrappers, so React's next removeChild/insertBefore on
// that text throws NotFoundError and the error boundary replaces the page.
// 29 non-English users hit it in 14 days (Sep 2026), 12 of them on /onboarding.
// Mimics Translate on the demo app, then drives updates and navigation.
// Run: node e2e/harness/translate-crash-check.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 4332;
const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true, open: false } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 140)));

// What Translate does: every visible text node becomes <font><font>text</font></font>.
const translate = () => page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeValue.trim() && !['SCRIPT', 'STYLE', 'FONT'].includes(n.parentNode.nodeName)) nodes.push(n);
  }
  for (const n of nodes) {
    const outer = document.createElement('font');
    const inner = document.createElement('font');
    inner.textContent = n.nodeValue;
    outer.appendChild(inner);
    n.parentNode.replaceChild(outer, n);
  }
  return nodes.length;
});
const go = async (route) => {
  await page.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, route);
  await page.waitForTimeout(1500);
};

let crashed = false;
try {
  await page.addInitScript(() => {
    try { localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 })); } catch {}
  });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: /demo/i }).first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2500);

  for (const route of ['/dashboard', '/trades', '/journal', '/goals', '/dashboard']) {
    await go(route);
    const swapped = await translate();
    // Force React to touch the translated text: data refresh + next navigation.
    await page.evaluate(() => { window.dispatchEvent(new Event('tradesUpdated')); window.dispatchEvent(new StorageEvent('storage', { key: 'x' })); });
    await page.waitForTimeout(800);
    const boundary = await page.getByText(/something went wrong/i).first().isVisible().catch(() => false);
    console.log(`${route}: translated ${swapped} text nodes, error screen shown: ${boundary}`);
    if (boundary) crashed = true;
  }
} finally {
  await browser.close();
  await server.close();
}
const dom = errors.filter((m) => /removeChild|insertBefore|NotFoundError|not a child/i.test(m));
console.log(`page errors: ${errors.length}, DOM NotFoundErrors: ${dom.length}`);
if (errors.length) console.log('   first:', errors[0]);
const failed = crashed || dom.length > 0;
console.log(failed ? 'FAIL: translated page crashes React' : 'PASS: translated page survives updates and navigation');
process.exit(failed ? 1 : 0);
