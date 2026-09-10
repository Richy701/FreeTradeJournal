import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

// Start `npm run dev -- --host 127.0.0.1` first, then run:
// node e2e/harness/ux-preview.mjs /tmp/ftj-ux-preview
// Uses a fresh demo browser session and blocks external requests.

const out = process.argv[2] || '/tmp/ftj-ux-before';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const capture = async name => {
    await page.waitForTimeout(500); // Allow resize/theme effects to settle before visual QA.
    await page.screenshot({ path: `${out}/${name}.png`, animations: 'disabled' });
  };
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
      ? route.continue() : route.abort();
  });
  await page.goto('http://127.0.0.1:5173');
  await page.getByText('View Live Demo', { exact: true }).first().click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Decline', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Decline', exact: true }).click().catch(() => {});
  await capture('dashboard');
  const tradeLink = page.getByRole('link', { name: 'Trade Log', exact: true }).first();
  assert((await tradeLink.boundingBox())?.x >= 0, 'Navigation should be visible on first desktop visit');
  await page.getByRole('link', { name: 'Trade Log', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Trade Log', exact: true }).waitFor();
  assert.equal(await tradeLink.getAttribute('aria-current'), 'page');
  await capture('trades');
  const search = page.getByRole('searchbox', { name: 'Search trades' });
  await search.fill('EURUSD');
  await page.getByText('Matching Trades', { exact: true }).waitFor();
  const symbols = await page.locator('tbody tr').allTextContents();
  assert(symbols.length > 0 && symbols.every(row => row.includes('EURUSD')));
  await search.fill('no-such-trade-ux-check');
  await page.getByText('No matching trades', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  assert.equal(await search.inputValue(), '');
  await search.fill('breakout');
  await search.press('Escape');
  assert.equal(await search.inputValue(), '');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Filter & sort', exact: true }).waitFor();
  assert.equal(await page.locator('#trade-log-filter-controls').isVisible(), false);
  await page.getByRole('button', { name: 'Filter & sort', exact: true }).click();
  assert.equal(await page.locator('#trade-log-filter-controls').isVisible(), true);
  await page.getByRole('button', { name: 'Filter & sort', exact: true }).click();
  await page.getByRole('button', { name: 'Show detailed statistics', exact: true }).click();
  assert.equal(await page.locator('#trade-log-statistics').isVisible(), true);
  await page.getByRole('button', { name: 'Hide detailed statistics', exact: true }).click();
  await page.getByRole('heading', { name: 'Trade Log', exact: true }).scrollIntoViewIfNeeded();
  await capture('trades-mobile');
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `Page overflow at ${width}px`);
  }
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
  await capture('trades-light');
  console.log('PASS: search, no results, reset, Escape, active navigation, mobile disclosures, and viewport overflow checks.');
} finally {
  await browser.close();
}
