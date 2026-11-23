// Black Friday 2026 announcement check: the in-app strip (fixture with mocked
// auth/plan) and the homepage hero pill (real landing page). Clock pinned
// during the sale and after it; screenshots dark/light, desktop/phone.
// Usage: node e2e/harness/black-friday-banners-check.mjs <outDir>
import { createServer } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5308
const base = `http://localhost:${PORT}`
const DURING = new Date('2026-11-27T15:00:00Z')
const LAST_DAY = new Date('2026-11-30T20:00:00Z')
const AFTER = new Date('2026-12-01T06:00:00Z')
const server = await createServer({ root: process.cwd(), server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
const failures = []

async function stripPage({ time, plan, isPro, demo = false, theme = 'dark', vp = { width: 1280, height: 400 } }) {
  const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.clock.install({ time })
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== base) return route.abort()
    const modules = {
      '/src/contexts/auth-context.tsx': `export const useAuth = () => ({ user: { uid: 'bf-preview' }, isDemo: ${demo} });`,
      '/src/contexts/pro-context.tsx': `export const useProStatus = () => ({ isPro: ${isPro}, subscription: ${plan ? `{ planType: '${plan}', status: 'active' }` : 'null'} });`,
      '/src/contexts/theme-presets.tsx': `export const useThemePresets = () => ({ themeColors: { primary: '#f59e0b' } });`,
      '/src/lib/analytics.ts': `export const trackEvent = (e, p) => { (window.bfEvents ||= []).push({ e, p }); };`,
    }
    if (modules[url.pathname]) return route.fulfill({ contentType: 'application/javascript', body: modules[url.pathname] })
    if (url.pathname === '/__bf-strip') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html class="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/harness/black-friday-strip-fixture.tsx');
    </script></body></html>` })
    return route.continue()
  })
  await page.goto(`${base}/__bf-strip`)
  await page.getByText('Dashboard', { exact: true }).waitFor({ timeout: 30_000 })
  await page.clock.runFor(1000)
  return { page, errors }
}

const strip = (page) => page.getByRole('region', { name: 'Black Friday offer' })

// Audience + window
for (const [label, opts, shouldShow] of [
  ['free-during', { time: DURING, plan: null, isPro: false }, true],
  ['monthly-during', { time: DURING, plan: 'monthly', isPro: true }, true],
  ['yearly-during', { time: DURING, plan: 'yearly', isPro: true }, false],
  ['lifetime-during', { time: DURING, plan: 'lifetime', isPro: true }, false],
  ['demo-during', { time: DURING, plan: null, isPro: false, demo: true }, false],
  ['free-after', { time: AFTER, plan: null, isPro: false }, false],
]) {
  const { page, errors } = await stripPage(opts)
  const shown = await strip(page).count()
  if (!!shown !== shouldShow) failures.push(`strip ${label}: expected ${shouldShow ? 'shown' : 'hidden'}`)
  if (errors.length) failures.push(`strip ${label}: ${errors.join(' | ')}`)
  console.log('strip', label, shown ? 'shown' : 'hidden')
  await page.close()
}

// Looks, last-day wording, snooze, link target, crossing the deadline
for (const theme of ['dark', 'light']) {
  for (const vp of [{ width: 1280, height: 300 }, { width: 375, height: 300 }]) {
    for (const [label, time] of [['during', DURING], ['lastday', LAST_DAY]]) {
      const { page } = await stripPage({ time, plan: null, isPro: false, theme, vp })
      const text = await strip(page).innerText()
      if (label === 'lastday' && !text.includes('ends tonight')) failures.push(`strip lastday ${theme} ${vp.width}: missing "ends tonight"`)
      if (label === 'during' && text.includes('ends tonight')) failures.push(`strip during ${theme} ${vp.width}: says ends tonight too early`)
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`strip ${label} ${theme} ${vp.width}: overflow`)
      await page.screenshot({ path: path.join(outDir, `strip-${label}-${theme}-${vp.width}.png`) })
      await page.close()
    }
  }
}
{
  const { page } = await stripPage({ time: DURING, plan: null, isPro: false })
  const href = await strip(page).getByRole('link').getAttribute('href')
  if (href !== '/pricing?plan=yearly') failures.push(`strip link goes to ${href}`)
  await page.getByRole('button', { name: 'Hide for today' }).click()
  if (await strip(page).count()) failures.push('strip still visible after X')
  await page.reload()
  await page.getByText('Dashboard', { exact: true }).waitFor()
  await page.clock.runFor(1000)
  if (await strip(page).count()) failures.push('strip came back on reload within the day')
  await page.clock.runFor(25 * 60 * 60 * 1000)
  if (!(await strip(page).count())) failures.push('strip did not return after the snooze day')
  await page.close()
}
{
  const { page } = await stripPage({ time: new Date('2026-12-01T04:59:00Z'), plan: null, isPro: false })
  const before = await strip(page).count()
  await page.clock.runFor(90_000)
  const after = await strip(page).count()
  if (!before || after) failures.push(`strip crossing deadline: before=${before} after=${after}`)
  await page.close()
}

// Homepage pill (real landing page, logged out)
for (const [label, time] of [['during', DURING], ['after', AFTER]]) {
  for (const theme of ['dark', 'light']) {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', (e) => { if (!/tradingview/.test(e.stack || '')) errors.push(e.message) })
      await page.clock.install({ time })
      await page.addInitScript((t) => {
        localStorage.setItem('ftj-theme', t)
        localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }))
      }, theme)
      await page.goto(`${base}/`)
      await page.waitForFunction(() => (document.body.textContent || '').includes('Keep the lesson'), null, { timeout: 30_000 })
      await page.clock.runFor(2500)
      const pill = page.locator('a[href="/pricing?plan=yearly"]', { hasText: 'View offers' })
      const count = await pill.count()
      const name = `home-${label}-${theme}-${vp.width}`
      if (label === 'during' && count !== 1) failures.push(`${name}: pill count ${count}`)
      if (label === 'after' && count !== 0) failures.push(`${name}: pill still showing`)
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`${name}: overflow`)
      if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`)
      await page.screenshot({ path: path.join(outDir, `${name}.png`) })
      console.log('captured', name, count)
      await page.close()
    }
  }
}

await browser.close(); await server.close()
if (failures.length) { console.error('FAILURES:\n' + failures.join('\n')); process.exit(1) }
console.log('all good'); process.exit(0)
