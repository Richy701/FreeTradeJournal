// Run with a Vite server: node --experimental-strip-types e2e/harness/analysis-offer-check.ts
// Local browser fixture only: existing demo analysis, mocked auth/AI, no external requests or purchases.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.OFFER_PREVIEW_URL || 'http://127.0.0.1:5176';
const out = '/tmp/ftj-analysis-offer';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
  page.on('console', message => { if (message.type() === 'error') console.error('Browser console:', message.text()); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    const modules: Record<string, string> = {
      '/src/contexts/auth-context.tsx': `export const useAuth = () => ({ user: { uid: 'offer-preview', metadata: {creationTime: '2025-01-01'} }, isDemo: false, hadSession: true });`,
      '/src/contexts/pro-context.tsx': `export const useProStatus = () => ({ isPro: false, isLoading: false, hasAIAccess: false, freeAiQuota: {remaining: 0, limit: 5}, updateFreeAiQuota: () => {}, subscription: null, openCheckout: async priceId => {window.checkoutPrice = priceId;} });`,
      '/src/contexts/settings-context.tsx': `export const useSettings = () => ({getCurrencySymbol: () => '$'});`,
      '/src/contexts/account-context.tsx': `export const useAccounts = () => ({activeAccount: {id: 'preview'}, isAllAccounts: false});`,
      '/src/contexts/theme-presets.tsx': `export const useThemePresets = () => ({themeColors: {primary: '#f59e0b'}, alpha: (color, alpha) => color + alpha});`,
      '/src/hooks/use-streaming-ai.ts': `export const useStreamingAI = () => ({streamText: '', isStreaming: false, meta: null, abort: () => {}, startStream: () => {throw new Error('No new AI run should start at zero quota');} });`,
      '/src/lib/analytics.ts': `export const trackEvent = (event, props) => { (window.offerEvents ||= []).push({event, props}); };`,
      '/src/lib/track-activity.ts': `export const trackGateHit = () => {};`,
      '/src/components/blocks/footer-7.tsx': `export const Footer7 = () => null;`,
      '/src/components/blocks/testimonials-section.tsx': `export const TestimonialsSection = () => null;`,
      '/src/components/theme-toggle.tsx': `export const ThemeToggle = () => null;`,
    };
    if (modules[url.pathname]) return route.fulfill({ contentType: 'application/javascript', body: modules[url.pathname] });
    if (url.pathname === '/__offer-preview') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/analysis-offer-fixture.tsx');
    </script></body></html>` });
    return route.continue();
  });
  await page.goto(`${base}/__offer-preview`);
  const offer = page.getByRole('complementary', { name: 'Continue your reviews with Pro' });
  await page.waitForFunction(() => document.querySelector('#root')?.childElementCount, { }, { timeout: 10000 }).catch(async () => {
    throw new Error(`Fixture did not mount: ${errors.join('; ')}. Body: ${await page.locator('body').innerText()}`);
  });
  await offer.waitFor();
  assert.equal(await page.getByText('Get Unlimited AI', { exact: true }).count(), 0, 'Completed result must not be behind the quota wall');
  await offer.scrollIntoViewIfNeeded();
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await offer.scrollIntoViewIfNeeded();
    assert.equal(await offer.evaluate(el => el.scrollWidth > el.clientWidth), false, `Offer overflow at ${width}px`);
    await offer.screenshot({ path: `${out}/offer-${width}-dark.png` });
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await offer.screenshot({ path: `${out}/offer-desktop-light.png` });
  await page.getByRole('link', { name: 'View annual Pro', exact: true }).click();
  await page.getByRole('heading', { name: /^Pro Yearly/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: /yearly/i }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('heading', { name: /^Pro Yearly/ }).locator('..').getByRole('button', { name: 'Get Pro', exact: true }).click();
  assert(await page.evaluate(() => (window as unknown as {offerEvents: {event: string; props: {plan?: string; offer_source?: string}}[]}).offerEvents.some(e => e.event === 'checkout_started' && e.props.plan === 'yearly' && e.props.offer_source === 'analysis_annual_v1')));
  await page.goBack();
  await page.getByRole('link', { name: /Prefer monthly/ }).click();
  await page.getByRole('heading', { name: /^Pro Monthly/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'monthly', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.goBack();
  await page.getByRole('button', { name: 'Dismiss Pro offer for 30 days' }).click();
  assert.equal(await offer.count(), 0);
  await page.reload();
  await page.getByRole('button', { name: 'New', exact: true }).waitFor();
  assert.equal(await offer.count(), 0, 'Dismissal survives reload');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByText('Get Unlimited AI', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(`PASS: completed analysis at zero quota; offer at four widths; annual/monthly selection; checkout attribution with mocked checkout; persistent dismissal; new-run gate. Screenshots: ${out}`);
} finally {
  await browser.close();
}
