// Start Vite, then run: node --experimental-strip-types e2e/harness/weekly-focus-check.ts
// Uses existing demo trades with mock authentication; no AI calls or live account mutations.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.FOCUS_PREVIEW_URL || 'http://127.0.0.1:5176';
const out = '/tmp/ftj-post-trade-review';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, timezoneId: 'Europe/London' });
  await page.clock.install({ time: new Date('2026-09-10T12:00:00Z') });
  const errors: string[] = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    const modules: Record<string, string> = {
      '/src/contexts/auth-context.tsx': `export const useAuth = () => ({user: {uid: localStorage.getItem('fixture-user') || 'focus-preview', metadata: {creationTime: '2025-01-01'}}, loading: false, isDemo: false, hadSession: true});`,
      '/src/contexts/pro-context.tsx': `export const useProStatus = () => ({isPro: false, isLoading: false, hasAIAccess: false, hasAutoAIAccess: false, freeAiQuota: {remaining: 0, limit: 5}, updateFreeAiQuota: () => {}});`,
      '/src/contexts/account-context.tsx': `const accountState = ({activeAccount: {id: localStorage.getItem('fixture-account') || 'account-a', name: 'Trading account', currency: 'USD'}, accounts: [{id: 'account-a', name: 'Trading account', currency: 'USD'}], scopeAccounts: [{id: 'account-a', currency: 'USD'}], scopeStartingBalance: 10000, isInScope: r => !r.accountId || r.accountId === 'account-a', isAllAccounts: localStorage.getItem('fixture-combined') === 'yes', loading: false}); export const useAccounts = () => accountState;`,
      '/src/contexts/settings-context.tsx': `export const useSettings = () => ({settings: {pnlDisplayMode: 'currency', accountSize: 10000, currency: 'USD'}, updateSettings: () => {}, getCurrencySymbol: () => '$', formatCurrency: value => '$' + Number(value).toFixed(2)});`,
      '/src/contexts/theme-presets.tsx': `export const useThemePresets = () => ({themeColors: {primary: '#f59e0b', profit: '#22c55e', loss: '#ef4444', primaryButtonText: '#000000'}, alpha: (color, a) => color + a});`,
      '/src/hooks/use-streaming-ai.ts': `export const useStreamingAI = () => ({streamText: '', isStreaming: false, meta: null, abort: () => {}, startStream: () => {throw new Error('Live AI should not run in this fixture');}});`,
      '/src/lib/analytics.ts': `export const trackEvent = (event, props) => {(window.focusEvents ||= []).push({event, props});};`,
      '/src/lib/track-activity.ts': `export const trackGateHit = () => {}; export const trackActivity = () => {};`,
      '/src/components/site-header.tsx': `export const SiteHeader = () => null;`,
      '/src/components/app-footer.tsx': `export const AppFooter = () => null;`,
    };
    if (modules[url.pathname]) return route.fulfill({contentType: 'application/javascript', body: modules[url.pathname]});
    if (['/trades', '/journal', '/changelog', '/__review-whats-new'].includes(url.pathname)) return route.fulfill({contentType: 'text/html', body: `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body class="bg-background text-foreground"><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/post-trade-review-fixture.tsx');
    </script></body></html>`});
    return route.continue();
  });
  await page.goto(`${base}/trades`);
  await page.getByRole('button', {name: 'Quick review', exact: true}).first().click();
  const dialog = page.getByRole('dialog', {name: 'Post-trade review', exact: true});
  await page.getByRole('radio', {name: 'Partly followed my plan', exact: true}).click();
  await page.getByLabel('What would you repeat or change?').fill('Wait for confirmation before entering.');
  for (const width of [390, 1280]) {
    await page.setViewportSize({width, height: 1000});
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false);
    await dialog.screenshot({path: `${out}/review-${width}-dark.png`, animations: 'disabled'});
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await dialog.screenshot({path: `${out}/review-desktop-light.png`, animations: 'disabled'});
  await page.getByRole('button', {name: 'Save to journal', exact: true}).click();
  await dialog.waitFor({state: 'hidden'});
  await page.getByRole('button', {name: 'Quick review', exact: true}).first().click();
  assert.equal(await page.getByLabel('What would you repeat or change?').inputValue(), 'Wait for confirmation before entering.');
  await page.getByLabel('What would you repeat or change?').fill('Keep waiting for confirmation.');
  await page.getByRole('button', {name: 'Update review', exact: true}).click();
  await dialog.waitFor({state: 'hidden'});
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('user_focus-preview_journalEntries') || '[]'));
  assert.equal(records.filter(r => r.quickReview).length, 1);
  await page.getByRole('button', {name: 'Quick review', exact: true}).first().click();
  await page.getByRole('link', {name: 'Open in journal', exact: true}).click();
  await page.waitForURL('**/journal*');
  await page.getByText('Keep waiting for confirmation.', {exact: true}).first().waitFor();
  await page.goto(`${base}/trades`);
  await page.getByRole('button', {name: 'Quick review', exact: true}).first().click();
  await page.getByLabel('What would you repeat or change?').fill('A draft that must survive a failed save.');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.endsWith('_journalEntries')) throw new Error('Storage full');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', {name: 'Update review', exact: true}).click();
  await page.getByRole('alert').filter({hasText: 'Storage full'}).waitFor();
  assert.equal(await page.getByLabel('What would you repeat or change?').inputValue(), 'A draft that must survive a failed save.');
  const afterFailure = await page.evaluate(() => JSON.parse(localStorage.getItem('user_focus-preview_journalEntries') || '[]'));
  assert.equal(afterFailure.find(r => r.quickReview).content, 'Keep waiting for confirmation.');
  for (const route of ['/changelog', '/__review-whats-new']) {
    await page.goto(base + route);
    const picture = page.locator('img[src="/screenshots/post-trade-review.png"]');
    await picture.scrollIntoViewIfNeeded();
    await picture.evaluate(image => image.decode());
    assert(await picture.evaluate(image => image.naturalWidth > 0));
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: desktop/mobile trade action → review → journal save → edit without duplicate → open exact journal entry. Screenshots: ${out}`);
} finally { await browser.close(); }
