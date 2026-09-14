// Tag performance (v2.95.0): verify the Insights "Setups by tag" and "What
// mistakes cost" tables render in the demo, the tag deep link filters the
// Trade Log, and capture the What's New screenshot.
// Run: node e2e/harness/tag-performance-check.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.TAGS_OUT || path.join(ROOT, 'public/screenshots');
const PORT = 4324;
mkdirSync(OUT, { recursive: true });

const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true, open: false } });
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const go = async (route) => {
  await page.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, route);
  await page.waitForTimeout(1500);
};

try {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ftj-theme', 'dark');
      localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }));
    } catch {}
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: /demo/i }).first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Insights: both tables render with demo data.
  await go('/ideas');
  const setups = page.getByText('Setups by tag', { exact: true });
  await setups.waitFor({ state: 'visible', timeout: 20000 });
  const mistakes = page.getByText('What mistakes cost', { exact: true });
  await mistakes.waitFor({ state: 'visible', timeout: 10000 });
  const setupRows = await page.locator('table').first().locator('tbody tr').count();
  const mistakeRows = await page.locator('table').nth(1).locator('tbody tr').count();
  console.log(`setup tags: ${setupRows} rows, mistake tags: ${mistakeRows} rows`);
  assert.ok(setupRows > 0, 'expected setup tag rows');
  assert.ok(mistakeRows > 0, 'expected mistake tag rows');
  assert.ok(await page.getByText(/Trades tagged with a mistake average/).isVisible(), 'expected the mistake comparison sentence');

  // Screenshot the two-table grid. The app scrolls inside SidebarInset under a
  // sticky demo banner + breadcrumb header, so bring the grid to the top of
  // that container and back off by the header height before capturing.
  const grid = setups.locator('xpath=ancestor::div[contains(@class,"grid")][1]');
  await grid.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    let node = el.parentElement;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    (node ?? document.scrollingElement).scrollTop -= 170;
  });
  await page.waitForTimeout(500);
  await grid.screenshot({ path: path.join(OUT, 'tag-performance.png') });
  console.log('wrote tag-performance.png');

  // 2. Phone width: no horizontal page scroll from the tables.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('main') ?? document.body;
    return el.scrollWidth > el.clientWidth + 1;
  });
  assert.equal(overflow, false, 'insights page overflows at 390px');
  await page.setViewportSize({ width: 1440, height: 900 });

  // 3. Deep link: the first setup tag opens the Trade Log filtered to it.
  await go('/ideas');
  await setups.waitFor({ state: 'visible', timeout: 20000 });
  const firstTag = page.locator('table').first().locator('tbody tr').first().locator('a');
  const tagText = (await firstTag.innerText()).replace(/^#/, '');
  await firstTag.click();
  await page.waitForURL(/\/trades/, { timeout: 15000 });
  await page.locator('table').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(800);
  assert.ok(!page.url().includes('tag='), 'tag param should be consumed');
  const pill = page.getByText(new RegExp(tagText, 'i')).first();
  assert.ok(await pill.isVisible(), `expected an active filter for ${tagText}`);
  const rows = await page.locator('table tbody tr').count();
  console.log(`deep link "${tagText}": ${rows} rows`);
  assert.ok(rows > 0, 'deep link should show matching trades');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  console.log('ALL CHECKS PASSED');
} finally {
  await browser.close();
  await server.close();
}
