// Local rendered-page check. No sign-in, checkout or external requests.
// HISTORY_PREVIEW_URL=http://127.0.0.1:5176 node e2e/harness/history-pricing-check.ts
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.HISTORY_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = '/tmp/ftj-history-pricing';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.goto(`${base}/pricing?plan=monthly&source=history_review_v1`);
  await page.getByRole('heading', { level: 1, name: /Review beyond the last 30 days/ }).waitFor();
  assert.equal(await page.getByRole('tab', { name: 'monthly', exact: true }).getAttribute('data-state'), 'active');
  assert.equal(await page.getByRole('link', { name: 'Continue with Free — back to dashboard' }).getAttribute('href'), '/dashboard');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 960 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Horizontal overflow at ${width}px`);
    await page.screenshot({ path: `${output}/history-${width}.png` });
  }
  await page.getByRole('tab', { name: /yearly/i }).click();
  assert.equal(await page.getByRole('tab', { name: /yearly/i }).getAttribute('data-state'), 'active');
  await page.waitForFunction(() => document.querySelector('main')?.textContent?.includes('Pro Yearly'));
  await page.getByRole('heading', { level: 1, name: /Review beyond the last 30 days/ }).waitFor();
  await page.getByRole('tab', { name: 'monthly', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('main')?.textContent?.includes('Pro Monthly'));
  await page.goto(`${base}/pricing`);
  await page.getByRole('heading', { level: 1, name: /Start with your trades/ }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Continue with Free — back to dashboard' }).count(), 0);
  await page.goto(`${base}/pricing?plan=yearly&source=analysis_annual_v1`);
  await page.waitForFunction(() => document.querySelector('main')?.textContent?.includes('Pro Yearly'));
  await page.getByRole('heading', { level: 1, name: /Start with your trades/ }).waitFor();
  assert.deepEqual(errors, []);
  console.log(`PASS: contextual history page at desktop/mobile, no overflow, monthly/yearly switching, ordinary pricing and annual-offer regression. Screenshots: ${output}`);
} finally {
  await browser.close();
}
