// Profit Factor card (v2.98.0): verify it renders with real values in the
// demo Trade Log, the five cards end each row flush, and the phone summary
// lists it; capture the What's New screenshot.
// Run: node e2e/harness/trade-log-r-pf-check.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.RPF_OUT || path.join(ROOT, 'public/screenshots');
const REVIEW = process.env.RPF_REVIEW || OUT;
const PORT = 4324;
mkdirSync(OUT, { recursive: true });
mkdirSync(REVIEW, { recursive: true });

const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true, open: false } });
const base = `http://localhost:${PORT}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const go = async (route) => {
  await page.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, route);
  await page.waitForTimeout(1200);
};

// Rows of cards must each end on one bottom edge.
const assertRowsFlush = async (cards, label) => {
  const n = await cards.count();
  const rows = new Map();
  for (let i = 0; i < n; i++) {
    const b = await cards.nth(i).boundingBox();
    const k = Math.round(b.y);
    rows.set(k, [...(rows.get(k) || []), { bottom: Math.round(b.y + b.height), right: Math.round(b.x + b.width) }]);
  }
  const rights = [];
  for (const [y, cells] of rows) {
    const bottoms = cells.map((c) => c.bottom);
    assert.ok(Math.max(...bottoms) - Math.min(...bottoms) <= 1, `${label}: row at ${y} has uneven card bottoms: ${bottoms.join(',')}`);
    rights.push(Math.max(...cells.map((c) => c.right)));
  }
  assert.ok(Math.max(...rights) - Math.min(...rights) <= 1, `${label}: rows do not end on the same right edge: ${rights.join(',')}`);
  console.log(`${label}: ${rows.size} rows, all flush`);
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
  await go('/trades');
  await page.locator('table').first().waitFor({ state: 'visible', timeout: 20000 });

  const grid = page.locator('#trade-log-statistics');
  await grid.waitFor({ state: 'visible', timeout: 10000 });
  const cards = grid.locator(':scope > *');
  assert.equal(await cards.count(), 5, `expected 5 stat cards, saw ${await cards.count()}`);
  const pfCard = grid.locator(':scope > *', { has: page.getByText('Profit Factor', { exact: true }) });
  assert.equal(await pfCard.count(), 1, 'Profit Factor card missing');
  assert.equal(await grid.getByText('Realized R').count(), 0, 'Realized R must not render');
  const pfText = (await pfCard.innerText()).replace(/\s+/g, ' ');
  console.log('Profit Factor card:', pfText);
  assert.match(pfText, /\d+\.\d{2}x|∞/, 'Profit Factor headline should be a ratio');
  assert.match(pfText, /Won .*Lost /, 'card should show money won and lost');
  // The old small-print PF line under Avg R:R is gone.
  const rrCard = grid.locator(':scope > *', { has: page.getByText('Avg R:R', { exact: true }) });
  assert.doesNotMatch(await rrCard.innerText(), /PF:/, 'PF line should no longer sit under Avg R:R');

  await assertRowsFlush(cards, '1440px');

  // Changelog screenshot: the stats grid in full, clear of the sticky header.
  await grid.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    let node = el.parentElement;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    const covered = Math.max(0, ...[...document.querySelectorAll('header, [role="banner"]')].map((h) => h.getBoundingClientRect().bottom));
    (node ?? document.scrollingElement).scrollTop -= covered + 16;
  });
  await page.waitForTimeout(600);
  const gb = await grid.boundingBox();
  await page.screenshot({
    path: path.join(OUT, 'trade-log-profit-factor.png'),
    clip: { x: gb.x - 12, y: gb.y - 12, width: gb.width + 24, height: gb.height + 24 },
  });
  console.log('wrote trade-log-profit-factor.png');

  // Very wide: three cards then two, still flush.
  await page.setViewportSize({ width: 1700, height: 1000 });
  await page.waitForTimeout(800);
  await assertRowsFlush(cards, '1700px');
  await page.screenshot({ path: path.join(REVIEW, 'trade-log-stats-1700.png'), clip: await grid.boundingBox() });

  // Phone summary strip: five tiles, last one full width, no horizontal overflow.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const strip = page.locator('dl.grid.grid-cols-2').first();
  await strip.waitFor({ state: 'visible', timeout: 10000 });
  const tiles = await strip.locator('dt').allInnerTexts();
  console.log('phone tiles:', tiles.join(' | '));
  assert.ok(tiles.includes('Profit factor'), 'phone strip should list Profit factor');
  assert.ok(!tiles.includes('Realized R'), 'phone strip must not list Realized R');
  await assertRowsFlush(strip.locator(':scope > *'), '390px strip');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'page overflows at 390px');
  await strip.screenshot({ path: path.join(REVIEW, 'trade-log-stats-390.png') });
  console.log('wrote trade-log-stats-390.png (review only)');

  assert.deepEqual(errors, [], `page errors: ${errors.join('\n')}`);
  console.log('OK');
} finally {
  await browser.close();
  await server.close();
}
