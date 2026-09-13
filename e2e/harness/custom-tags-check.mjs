// Custom tags (v2.94.0): verify the trade-form tag input and the Tags filter
// render in the demo, and capture the two What's New screenshots.
// Run: node e2e/harness/custom-tags-check.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.TAGS_OUT || path.join(ROOT, 'public/screenshots');
const PORT = 4323;
mkdirSync(OUT, { recursive: true });

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

  // 1. Tags under strategy in the table (demo trades already carry tags).
  const chips = page.locator('table span', { hasText: /^#/ });
  assert.ok((await chips.count()) > 0, 'expected tag chips under strategy in the table');

  // 2. Tags facet: open it, pick a tag, confirm the list narrows.
  const tagsBtn = page.getByRole('button', { name: /^Tags/ });
  if (!(await tagsBtn.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /filter/i }).first().click();
    await page.waitForTimeout(400);
  }
  await tagsBtn.waitFor({ state: 'visible', timeout: 10000 });
  const rowsBefore = await page.locator('table tbody tr').count();
  await tagsBtn.click();
  await page.waitForTimeout(300);
  const option = page.getByRole('option').first();
  const optionLabel = (await option.innerText()).trim();
  await option.click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const rowsAfter = await page.locator('table tbody tr').count();
  console.log(`tag filter "${optionLabel}": ${rowsBefore} rows -> ${rowsAfter}`);
  assert.ok(rowsAfter > 0 && rowsAfter < rowsBefore, 'tag filter should narrow the table');
  await page.waitForTimeout(300);
  // Crop from the filter bar down through the first rows so the pill and the
  // per-row tag chips are both in frame. The app scrolls inside SidebarInset,
  // so this is a viewport clip rather than an element screenshot.
  const bar = tagsBtn.locator('xpath=..');
  // Bring the bar to the top of the scroll container: a clip is capped at the
  // viewport edge, so capturing near the bottom of the screen cuts the rows off.
  await bar.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    // Back off from the sticky page header so the facet buttons are not under it.
    let node = el.parentElement;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    (node ?? document.scrollingElement).scrollTop -= 104;
  });
  await page.waitForTimeout(400);
  const barBox = await bar.boundingBox();
  await page.screenshot({
    path: path.join(OUT, 'trade-tags-filter.png'),
    clip: { x: barBox.x - 12, y: barBox.y - 12, width: barBox.width + 24, height: 520 },
  });
  console.log('wrote trade-tags-filter.png');
  // clear the filter again
  await page.getByRole('button', { name: /clear all/i }).click().catch(() => {});

  // 3. Trade form: add two tags, type to surface a suggestion.
  await page.getByRole('button', { name: /^Add Trade$/ }).first().click();
  const input = page.locator('#trade-tags-input');
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.scrollIntoViewIfNeeded();
  await input.fill('FVG'); await input.press('Enter');
  await input.fill('Order Block'); await input.press('Enter');
  await input.fill('#FVG'); await input.press('Enter'); // duplicate with hash: ignored
  const chipCount = await page.locator('[aria-label^="Remove tag "]').count();
  assert.equal(chipCount, 2, `expected 2 chips, got ${chipCount}`);
  await input.fill('t');
  await page.waitForTimeout(200);
  const suggested = page.locator('[aria-label="Suggested tags"] button');
  assert.ok((await suggested.count()) > 0, 'expected suggestions while typing');
  await suggested.first().click();
  assert.equal(await page.locator('[aria-label^="Remove tag "]').count(), 3, 'suggestion click adds a chip');
  await input.fill('n');
  await page.waitForTimeout(300);
  const card = page.locator('div.rounded-xl', { has: page.locator('#trade-tags-input') }).last();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await card.screenshot({ path: path.join(OUT, 'trade-tags.png') });
  console.log('wrote trade-tags.png');

  // 4. Phone width: nothing overflows the dialog.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const dialog = page.getByRole('dialog').first();
  assert.equal(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth), false, 'dialog overflows at 390px');
  await card.screenshot({ path: path.join(os.tmpdir(), 'trade-tags-390.png') }); // review only, not shipped

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  console.log('ALL CHECKS PASSED');
} finally {
  await browser.close();
  await server.close();
}
