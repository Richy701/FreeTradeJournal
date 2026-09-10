// Start Vite, then run: node --experimental-strip-types e2e/harness/weekly-focus-check.ts
// Uses existing demo trades with mock authentication; no AI calls or live account mutations.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.FOCUS_PREVIEW_URL || 'http://127.0.0.1:5176';
const out = '/tmp/ftj-weekly-focus';
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
      '/src/contexts/account-context.tsx': `export const useAccounts = () => ({activeAccount: {id: localStorage.getItem('fixture-account') || 'account-a', name: 'Trading account'}, isAllAccounts: localStorage.getItem('fixture-combined') === 'yes', loading: false});`,
      '/src/contexts/settings-context.tsx': `export const useSettings = () => ({getCurrencySymbol: () => '$', formatCurrency: value => '$' + Number(value).toFixed(2)});`,
      '/src/contexts/theme-presets.tsx': `export const useThemePresets = () => ({themeColors: {primary: '#f59e0b', profit: '#22c55e', loss: '#ef4444', primaryButtonText: '#000000'}, alpha: (color, a) => color + a});`,
      '/src/hooks/use-demo-data.ts': `import { DEMO_TRADES } from '/src/data/demo-data.ts'; export const useDemoData = () => ({getTrades: () => DEMO_TRADES, isDemo: false});`,
      '/src/hooks/use-streaming-ai.ts': `export const useStreamingAI = () => ({streamText: '', isStreaming: false, meta: null, abort: () => {}, startStream: () => {throw new Error('Live AI should not run in this fixture');}});`,
      '/src/lib/analytics.ts': `export const trackEvent = (event, props) => {(window.focusEvents ||= []).push({event, props});};`,
      '/src/lib/track-activity.ts': `export const trackGateHit = () => {};`,
      '/src/components/site-header.tsx': `export const SiteHeader = () => null;`,
      '/src/components/app-footer.tsx': `export const AppFooter = () => null;`,
    };
    if (modules[url.pathname]) return route.fulfill({contentType: 'application/javascript', body: modules[url.pathname]});
    if (['/coach', '/dashboard', '/changelog', '/__weekly-whats-new'].includes(url.pathname)) return route.fulfill({contentType: 'text/html', body: `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body class="bg-background text-foreground"><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/weekly-focus-fixture.tsx');
    </script></body></html>`});
    return route.continue();
  });
  await page.goto(`${base}/coach`);
  const focus = page.locator('#weekly-focus');
  await focus.waitFor();
  await page.getByRole('button', {name: 'Use this tip for my weekly focus', exact: true}).first().click();
  await page.getByText('The coaching tip you chose', {exact: true}).waitFor();
  const habit = 'Write my entry reason before each trade.';
  await page.getByLabel('What is one thing you want to practise?').fill(habit);
  await page.getByRole('button', {name: 'Start seven-day focus', exact: true}).click();
  await page.getByRole('button', {name: 'Followed it', exact: true}).click();
  await page.getByText('Followed on 1 of 1 recorded trading days', {exact: true}).waitFor();
  await page.getByRole('button', {name: 'Missed it', exact: true}).click();
  await page.getByText('Followed on 0 of 1 recorded trading days', {exact: true}).waitFor();
  await page.waitForFunction(() => !document.querySelector('#weekly-focus fieldset')?.hasAttribute('disabled'));
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({width, height: 1000});
    await focus.scrollIntoViewIfNeeded();
    assert.equal(await focus.evaluate(el => el.scrollWidth > el.clientWidth), false, `Focus overflow at ${width}px`);
    await focus.screenshot({path: `${out}/active-${width}-dark.png`, animations: 'disabled'});
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await focus.screenshot({path: `${out}/active-desktop-light.png`, animations: 'disabled'});
  await page.goto(`${base}/dashboard`);
  await page.getByRole('link', {name: 'Open focus', exact: true}).click();
  await page.getByRole('button', {name: 'Missed it', exact: true}).waitFor();
  assert.equal(await page.getByRole('button', {name: 'Missed it', exact: true}).getAttribute('aria-pressed'), 'true');
  await page.evaluate(() => localStorage.setItem('fixture-account', 'account-b'));
  await page.reload();
  await page.getByLabel('What is one thing you want to practise?').waitFor();
  assert.equal(await page.getByText(habit, {exact: true}).count(), 0);
  await page.evaluate(() => { localStorage.removeItem('fixture-account'); localStorage.setItem('fixture-user', 'another-user'); });
  await page.reload();
  await page.getByLabel('What is one thing you want to practise?').waitFor();
  assert.equal(await page.getByText(habit, {exact: true}).count(), 0);
  await page.evaluate(() => localStorage.removeItem('fixture-user'));
  await page.reload();
  await page.clock.setSystemTime(new Date('2026-09-11T12:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('button', {name: /Friday.*11/}).click();
  await page.getByRole('button', {name: "Didn't trade", exact: true}).click();
  await page.getByText('Followed on 0 of 1 recorded trading days', {exact: true}).waitFor();
  await page.clock.setSystemTime(new Date('2026-09-17T12:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByRole('heading', {name: 'Your seven-day review', exact: true}).waitFor();
  await page.setViewportSize({width: 1100, height: 1000});
  await focus.screenshot({path: `${out}/review-desktop-dark.png`, animations: 'disabled'});
  await page.setViewportSize({width: 390, height: 1000});
  await focus.screenshot({path: `${out}/review-mobile.png`, animations: 'disabled'});
  await page.getByLabel('What helped, and what will you change next week?').fill('Writing it down helped. I want to continue next week.');
  await page.getByRole('button', {name: 'Save weekly review', exact: true}).click();
  await page.getByText('Review saved. Choose your focus for the next seven days.', {exact: true}).waitFor();
  await page.getByRole('button', {name: 'Use the same habit', exact: true}).click();
  assert.equal(await page.getByLabel('What is one thing you want to practise?').inputValue(), habit);
  await page.getByRole('button', {name: 'Start seven-day focus', exact: true}).click();
  await page.getByText('Past weekly reviews', {exact: true}).click();
  await page.getByText('Writing it down helped. I want to continue next week.', {exact: true}).waitFor();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('user_focus-preview_coachingFocus') || '[]'));
  assert.equal(records.filter((r: {kind: string}) => r.kind === 'plan').length, 2);
  assert.equal(records.filter((r: {kind: string}) => r.kind === 'review').length, 1);
  for (const path of ['/changelog', '/__weekly-whats-new']) {
    await page.goto(`${base}${path}`);
    for (const source of ['weekly-focus.png', 'weekly-focus-review.png']) {
      const screenshot = page.locator(`img[src="/screenshots/${source}"]`);
      await screenshot.scrollIntoViewIfNeeded();
      await screenshot.evaluate(image => image.decode());
      assert(await screenshot.evaluate(image => image.naturalWidth > 0));
    }
    await page.screenshot({path: `${out}/${path === '/changelog' ? 'release-notes' : 'whats-new'}-mobile.png`, animations: 'disabled'});
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: coaching tip → focus → corrected check-in → dashboard return → account/user isolation → non-trading day → seven-day review → repeat habit. Both feature pictures load in release notes and What's New. Four widths, dark/light screenshots: ${out}`);
} finally { await browser.close(); }
