/**
 * Trade Ideas (community feed) changelog screenshots against the local dev
 * server, in demo mode: default theme, dark mode, 1440x900 at 2x, full app view.
 *
 * Usage: npm run dev (in another terminal), then `npx tsx scripts/take-trade-ideas-screenshots.ts`
 * Pass an output directory as the first argument to write somewhere other than public/screenshots.
 */
import { chromium, type Page } from 'playwright'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve(process.argv[2] ?? 'public/screenshots')

async function enterDemo(page: Page) {
  await page.goto(`${BASE_URL}/prop-tracker`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => {
    localStorage.setItem('selected-theme', 'default')
    localStorage.setItem('ftj-theme', 'dark')
    localStorage.setItem('ftj-dismiss-deals-pt', '1')
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: true, marketing: false, timestamp: Date.now() }))
    sessionStorage.setItem('demo-banner-dismissed', 'true')
  })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1500)
  const demoBtn = page.getByRole('button', { name: /Try Live Demo/i }).or(page.getByRole('link', { name: /Try Live Demo/i })).first()
  await demoBtn.click({ timeout: 10000 })
  await page.waitForTimeout(3000)
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    const gotIt = [...document.querySelectorAll('button')].find(b => /got it/i.test(b.textContent ?? ''))
    gotIt?.click()
  })
  await page.waitForTimeout(400)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' })
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  await enterDemo(page)
  // Demo mode lives in React state, so navigate client-side (a reload would
  // bounce to the login page).
  await page.evaluate(() => {
    window.history.pushState({}, '', '/trade-ideas')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForURL(/\/trade-ideas/, { timeout: 15000 })
  await page.waitForTimeout(1800)
  const browseFirst = page.getByRole('button', { name: /Browse first/i })
  if (await browseFirst.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.screenshot({ path: path.join(OUT_DIR, 'trade-ideas-welcome.png') })
    console.log('Saved: trade-ideas-welcome.png')
    await browseFirst.click()
    await page.waitForTimeout(400)
  }
  const tipClose = page.getByRole('button', { name: /Dismiss tip/i })
  if (await tipClose.isVisible({ timeout: 800 }).catch(() => false)) await tipClose.click()
  await page.waitForTimeout(300)

  await page.screenshot({ path: path.join(OUT_DIR, 'trade-ideas-feed.png') })
  console.log('Saved: trade-ideas-feed.png')

  // Post form, filled in. Demo can open it; only submitting is guarded.
  await page.getByRole('button', { name: /Post an idea/ }).first().click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: 'Futures' }).click()
  await page.getByRole('combobox').first().click()
  await page.waitForTimeout(300)
  await page.keyboard.type('NQ')
  await page.waitForTimeout(300)
  await page.getByRole('option', { name: /^NQ\b/ }).first().click().catch(async () => {
    await page.getByRole('option').first().click()
  })
  await page.getByRole('button', { name: 'Short' }).click()
  await page.locator('#idea-entry').fill('19240')
  await page.locator('#idea-stop').fill('19290')
  await page.locator('#idea-target').fill('19120')
  await page.locator('#idea-reasoning').fill('Failed breakout above yesterday\'s high with volume drying up. Short the retest of 19240, first target the overnight VWAP. Will cut if we hold above 19290 for more than two 5m closes.')
  await page.locator('#idea-reasoning').blur()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT_DIR, 'trade-ideas-post.png') })
  console.log('Saved: trade-ideas-post.png')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  // Link a trade on the poster's own open idea, with a trade picked.
  await page.getByRole('button', { name: /Link a trade/ }).first().click()
  await page.waitForTimeout(700)
  const list = page.getByRole('group', { name: /Your closed trades/ })
  const winner = list.getByRole('button', { name: /EURUSD Long.*\+\$450/ })
  if (await winner.count()) await winner.first().click()
  else await list.getByRole('button').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(OUT_DIR, 'trade-ideas-link-trade.png') })
  console.log('Saved: trade-ideas-link-trade.png')
  await page.keyboard.press('Escape')

  if (errors.length) {
    console.log('\nConsole/page errors:')
    for (const e of errors) console.log('  - ' + e)
  } else {
    console.log('\nNo console or page errors.')
  }
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
