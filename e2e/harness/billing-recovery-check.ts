// Local component rendering + mocked portal only. No customer or billing writes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.HISTORY_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = '/tmp/ftj-billing-recovery';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let portalModuleRequests = 0;
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/src/lib/stripe.ts') {
      portalModuleRequests++;
      return route.fulfill({ contentType: 'application/javascript', body: `let attempts = 0; export async function redirectToPortal() { attempts++; if (attempts === 1) throw new Error('mock portal failure'); }` });
    }
    if (url.pathname === '/__billing-recovery') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/billing-recovery-fixture.tsx');
    </script></body></html>` });
    return route.continue();
  });
  await page.goto(`${base}/__billing-recovery`);
  const recover = page.getByRole('region', { name: 'past_due', exact: true });
  await recover.getByRole('button', { name: 'Manage billing', exact: true }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'active', exact: true }).getByRole('button', { name: 'Manage subscription' }).count(), 1);
  assert.equal(await page.getByRole('region', { name: 'cancelled', exact: true }).getByRole('button', { name: 'Manage subscription' }).count(), 1);
  assert.equal(await page.getByRole('region', { name: 'never-paid', exact: true }).getByRole('button').count(), 0);
  assert.equal(await page.getByRole('region', { name: 'demo', exact: true }).getByRole('button').count(), 0);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/billing-${width}-dark.png` });
  }
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.screenshot({ path: `${output}/billing-390-light.png` });
  await recover.getByRole('button', { name: 'Manage billing', exact: true }).click();
  await page.getByText('Could not open billing. Please try again.', { exact: true }).waitFor();
  await recover.getByRole('button', { name: 'Manage billing', exact: true }).click();
  assert.equal(await recover.getByRole('button', { name: 'Opening…' }).isDisabled(), true);
  assert.equal(portalModuleRequests, 1);
  assert.deepEqual(errors, []);
  console.log(`PASS: billing access across paid/lapsed/never-paid/demo states, failure recovery and pending redirect; desktop/mobile screenshots in ${output}`);
} finally {
  await browser.close();
}
