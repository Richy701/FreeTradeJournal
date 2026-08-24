/**
 * Changelog screenshots for the calendar-note screenshots and the relabelled
 * Trading Sessions widget, against the local dev server in demo mode.
 *
 * Usage: npm run dev (in another terminal), then `npx tsx scripts/take-abdoul-screenshots.ts`
 */
import { chromium, type Page } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve(process.argv[2] ?? 'public/screenshots')
const CHART = ['public/images/screenshots/equity-curve-screenshot.png', 'public/screenshots/equity-curve-screenshot.png']
  .map(p => path.resolve(p)).find(p => fs.existsSync(p))!

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
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  await page.waitForTimeout(2500)

  // Trading Sessions card
  const sessionsCard = page.getByText('Trading Sessions', { exact: true }).locator('xpath=ancestor::div[contains(@class,"h-[450px]")]').first()
  await sessionsCard.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.mouse.move(5, 5)
  await page.waitForTimeout(300)
  await sessionsCard.screenshot({ path: path.join(OUT_DIR, 'sessions-relabelled.png') })
  console.log('Saved: sessions-relabelled.png')
  // Verification shots of the other two views (not shipped).
  const VERIFY_DIR = process.env.VERIFY_DIR
  if (VERIFY_DIR) {
    for (const view of ['Win rate', 'Trades']) {
      await sessionsCard.getByRole('button', { name: view, exact: true }).click()
      await page.waitForTimeout(500)
      await page.mouse.move(5, 5)
      await sessionsCard.screenshot({ path: path.join(VERIFY_DIR, `sessions-${view.toLowerCase().replace(' ', '-')}.png`) })
    }
    await sessionsCard.getByRole('button', { name: 'P&L', exact: true }).click()
    await sessionsCard.getByRole('button', { name: 'Radar view' }).click()
    await page.waitForTimeout(500)
    await page.mouse.move(5, 5)
    await sessionsCard.screenshot({ path: path.join(VERIFY_DIR, 'sessions-radar.png') })
    await sessionsCard.getByRole('button', { name: 'Bars view' }).click()
    await page.waitForTimeout(300)
  }

  // Calendar day note with a chart attached
  const calendar = page.getByText('Trading Calendar', { exact: false }).first()
  await calendar.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(500)
  const days = page.locator('div[role="button"][class*="h-[72px]"][class*="opacity-100"]').filter({ hasText: /\$/ })
  const day = days.first()
  await day.scrollIntoViewIfNeeded()
  await day.click({ timeout: 10000 })
  await page.waitForTimeout(600)
  await page.getByRole('dialog').waitFor({ timeout: 10000 })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /Add note/ }).click()
  await page.waitForTimeout(500)
  await page.locator('#journal-title').fill('Daily bias: DXY pushing higher')
  await page.locator('#journal-content').fill('DXY held the overnight low and is grinding up into London. Bias is short EURUSD below 1.0850, looking for the sweep of yesterday\'s low. No trades before the 8:30 news.')
  await page.locator('input[type="file"][aria-label="Upload chart screenshots"]').setInputFiles(CHART)
  await page.waitForTimeout(1200)
  const dialog = page.getByRole('dialog').first()
  await dialog.screenshot({ path: path.join(OUT_DIR, 'calendar-note-screenshots.png') })
  console.log('Saved: calendar-note-screenshots.png')

  if (errors.length) {
    console.log('\nConsole/page errors:')
    for (const e of errors) console.log('  - ' + e)
  } else {
    console.log('\nNo console or page errors.')
  }
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
