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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, timezoneId: 'Europe/London' });
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
  for (const width of [390, 1280]) {
    await page.setViewportSize({width, height: 1000});
    for (const route of ['/__review-whats-new', '/changelog']) {
      await page.goto(base + route);
      const images = page.locator('img[src^="/screenshots/"]');
      await images.first().waitFor();
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(image => image.decode());
        const dimensions = await img.evaluate(image => {
          const rect = image.getBoundingClientRect();
          return {naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: rect.width, height: rect.height};
        });
        assert(Math.abs(dimensions.height - dimensions.width * dimensions.naturalHeight / dimensions.naturalWidth) < 2, 'Preview must preserve image proportions');
      }
      const enlarge = page.getByRole('button', {name: /Enlarge screenshot:/}).first();
      await enlarge.click();
      const viewer = page.getByRole('dialog', {name: 'Feature screenshot', exact: true});
      await viewer.waitFor();
      await viewer.locator('img').evaluate(image => image.decode());
      await page.screenshot({path: `/tmp/ftj-images-${width}-enlarged.png`, animations: 'disabled'});
      await page.keyboard.press('Escape');
      await viewer.waitFor({state: 'hidden'});
      assert(await enlarge.isVisible());
      if (route === '/__review-whats-new') assert(await page.getByRole('dialog').isVisible());
      await images.first().scrollIntoViewIfNeeded();
      await page.screenshot({path: `/tmp/ftj-images-${width}-${route === '/changelog' ? 'changelog' : 'whats-new'}.png`, animations: 'disabled'});
    }
  }
  console.log('PASS: original proportions, image viewer, Escape dismissal, and parent dialog preserved at mobile and desktop widths.');
} finally { await browser.close(); }
