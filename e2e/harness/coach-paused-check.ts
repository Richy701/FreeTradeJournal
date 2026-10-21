// Run with a Vite server: node --experimental-strip-types e2e/harness/coach-paused-check.ts
// Local browser fixture only: demo trades, mocked auth/AI, the AI call answers
// with the free daily auto cap. Also checks /pricing opens on monthly.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.COACH_PREVIEW_URL || 'http://127.0.0.1:5176';
const out = '/tmp/ftj-coach-paused';
mkdirSync(out, { recursive: true });
const isPro = process.env.COACH_PRO === '1';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.message); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    const modules: Record<string, string> = {
      '/src/contexts/auth-context.tsx': `export const useAuth = () => ({ user: { uid: 'coach-preview', metadata: {creationTime: '2025-01-01'} }, isDemo: false, hadSession: true });`,
      '/src/contexts/pro-context.tsx': `export const useProStatus = () => ({ isPro: ${isPro}, isLoading: false, hasAIAccess: true, hasAutoAIAccess: true, freeAiQuota: {remaining: 12, limit: 20}, updateFreeAiQuota: () => {}, subscription: null, openCheckout: async () => {} });`,
      '/src/contexts/settings-context.tsx': `export const useSettings = () => ({getCurrencySymbol: () => '$', formatCurrency: v => '$' + Number(v).toFixed(2), settings: {}});`,
      '/src/contexts/account-context.tsx': `export const useAccounts = () => ({activeAccount: {id: 'preview'}, isAllAccounts: false, scopeAccounts: [], isInScope: () => true});`,
      '/src/contexts/theme-presets.tsx': `export const useThemePresets = () => ({themeColors: {primary: '#f59e0b', profit: '#22c55e', loss: '#ef4444'}, alpha: (color, a) => color + a});`,
      '/src/hooks/use-demo-data.ts': `import { DEMO_TRADES } from '/src/data/demo-data.ts'; export const useDemoData = () => ({ getTrades: () => DEMO_TRADES, isDemo: false });`,
      '/src/hooks/use-streaming-ai.ts': `export const useStreamingAI = () => ({streamText: '', isStreaming: false, meta: null, abort: () => {}, startStream: () => {} });`,
      '/src/services/ai-assist.ts': `export const requestAIAssist = async () => { window.aiCalls = (window.aiCalls || 0) + 1; const e = new Error('Automatic AI suggestions are paused until tomorrow.'); e.code = 'functions/resource-exhausted'; throw e; };`,
      '/src/lib/analytics.ts': `export const trackEvent = (event, props) => { (window.coachEvents ||= []).push({event, props}); };`,
      '/src/lib/track-activity.ts': `export const trackGateHit = () => {}; export const trackActivity = () => {};`,
      '/src/components/blocks/footer-7.tsx': `export const Footer7 = () => null;`,
      '/src/components/blocks/testimonials-section.tsx': `export const TestimonialsSection = () => null;`,
      '/src/components/theme-toggle.tsx': `export const ThemeToggle = () => null;`,
    };
    if (modules[url.pathname]) return route.fulfill({ contentType: 'application/javascript', body: modules[url.pathname] });
    if (url.pathname === '/__coach-paused' || url.pathname === '/pricing') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/coach-paused-fixture.tsx');
    </script></body></html>` });
    return route.continue();
  });
  await page.goto(`${base}/__coach-paused`);
  await page.getByText('Coach FTJ', { exact: true }).first().waitFor({ timeout: 15000 });
  await page.waitForFunction(() => (window as unknown as { aiCalls?: number }).aiCalls, {}, { timeout: 10000 });
  const notice = page.getByText(/Today's AI read is used up/);
  if (isPro) {
    await page.waitForTimeout(500);
    assert.equal(await notice.count(), 0, 'Pro users never see the cap notice');
    console.log('PASS (pro): no notice');
  } else {
    await notice.waitFor();
    const card = notice.locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await card.scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Overflow at ${width}px`);
      await card.screenshot({ path: `${out}/coach-${width}-dark.png` });
    }
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await card.screenshot({ path: `${out}/coach-1280-light.png` });
    await page.getByRole('link', { name: 'Get Pro', exact: true }).click();
    const monthlyTab = page.getByRole('tab', { name: /monthly/i });
    await monthlyTab.waitFor();
    assert.equal(await monthlyTab.getAttribute('aria-selected'), 'true', '/pricing opens on monthly');
    assert(await page.evaluate(() => (window as unknown as { coachEvents: { event: string; props: { source?: string } }[] }).coachEvents.some(e => e.event === 'pro_gate_cta_clicked' && e.props.source === 'auto_ai_paused')));
    await page.screenshot({ path: `${out}/pricing-default.png` });
    await page.goto(`${base}/pricing?plan=yearly`);
    const yearlyTab = page.getByRole('tab', { name: /yearly/i });
    await yearlyTab.waitFor();
    assert.equal(await yearlyTab.getAttribute('aria-selected'), 'true', '?plan=yearly still opens on yearly');
    console.log(`PASS: cap notice shown at 360/1280, Get Pro tracked, /pricing defaults to monthly, ?plan=yearly kept. Screenshots: ${out}`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
