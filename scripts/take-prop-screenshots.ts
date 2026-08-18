/**
 * PropTracker screenshots, two sets from one run against the local dev server:
 *
 *  1. Landing/marketing (public/images/screenshots/): gold "Deep Yellow" preset
 *     (selected-theme=monochrome), dark mode, breadcrumb bar cropped off,
 *     1280x722 viewport at 2x, PNG + WebP (full, 1280w, 640w). Same look as
 *     every other marketing screenshot.
 *  2. Changelog (public/screenshots/): default theme, dark mode, demo data,
 *     1440x900 viewport at 2x, full app view including the breadcrumb bar.
 *
 * Usage: npm run dev (in another terminal), then `npx tsx scripts/take-prop-screenshots.ts`
 * Pass `landing` or `changelog` to run one set only.
 */
import { chromium, type Page } from 'playwright'
import sharp from 'sharp'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const LANDING_DIR = path.resolve('public/images/screenshots')
const CHANGELOG_DIR = path.resolve('public/screenshots')

const which = process.argv[2] ?? 'both'

async function enterDemo(page: Page, theme: 'monochrome' | 'default') {
  await page.goto(`${BASE_URL}/prop-tracker`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate((theme) => {
    localStorage.setItem('selected-theme', theme)
    localStorage.setItem('ftj-theme', 'dark')
    localStorage.setItem('ftj-dismiss-deals-pt', '1')
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: true, marketing: false, timestamp: Date.now() }))
    sessionStorage.setItem('demo-banner-dismissed', 'true')
  }, theme)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1500)
  const demoBtn = page.getByRole('button', { name: /Try Live Demo/i }).or(page.getByRole('link', { name: /Try Live Demo/i })).first()
  await demoBtn.click({ timeout: 10000 })
  await page.waitForTimeout(3500)
  // Kill the demo banner if it rendered anyway
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    const gotIt = [...document.querySelectorAll('button')].find(b => /got it/i.test(b.textContent ?? ''))
    gotIt?.click()
  })
  await page.waitForTimeout(500)
}

// The app scrolls inside SidebarInset, not the window
async function scrollApp(page: Page, y: number) {
  await page.evaluate((y) => {
    const el = [...document.querySelectorAll<HTMLElement>('*')].find(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 50)
    if (el) el.scrollTop = y
  }, y)
  await page.waitForTimeout(600)
}

async function dismissTip(page: Page) {
  const tipClose = page.getByRole('button', { name: /Dismiss tip/i })
  if (await tipClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await tipClose.click()
    await page.waitForTimeout(400)
  }
}

async function webpVariants(pngPath: string, dir: string, baseName: string) {
  await sharp(pngPath).webp({ quality: 85 }).toFile(path.join(dir, `${baseName}.webp`))
  await sharp(pngPath).resize(1280).webp({ quality: 85 }).toFile(path.join(dir, `${baseName}-1280w.webp`))
  await sharp(pngPath).resize(640).webp({ quality: 80 }).toFile(path.join(dir, `${baseName}-640w.webp`))
  console.log(`  -> ${baseName}.webp + 1280w + 640w`)
}

async function landing() {
  console.log('\n[landing] gold preset, 1280x722 @2x, chrome cropped')
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 }, deviceScaleFactor: 2, colorScheme: 'dark' })
  const page = await ctx.newPage()
  await enterDemo(page, 'monochrome')
  await dismissTip(page)

  // Height of the breadcrumb/site header so we crop it away like the other marketing shots
  const headerH = await page.evaluate(() => {
    const h = document.querySelector('header')
    return h ? Math.round(h.getBoundingClientRect().bottom) : 0
  })

  // 1. Overview: header numbers, tabs, risk calculator, first account cards
  const overview = path.join(LANDING_DIR, 'prop-tracker-screenshot.png')
  await page.screenshot({ path: overview, clip: { x: 0, y: headerH, width: 1280, height: 722 } })
  console.log('  Saved: prop-tracker-screenshot.png')
  await webpVariants(overview, LANDING_DIR, 'prop-tracker-screenshot')

  // 2. Firm accounts: the account card grid on its own
  const grid = page.locator('[role="tabpanel"][data-state="active"] .grid.lg\\:grid-cols-2').last()
  await grid.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const box = await grid.boundingBox()
  if (!box) throw new Error('Account grid not found')
  const firms = path.join(LANDING_DIR, 'prop-tracker-firms-screenshot.png')
  await page.screenshot({ path: firms, clip: { x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 12), width: Math.min(1280, box.width + 32), height: Math.min(box.height + 24, 1200 - Math.max(0, box.y - 12)) } })
  console.log('  Saved: prop-tracker-firms-screenshot.png')
  await webpVariants(firms, LANDING_DIR, 'prop-tracker-firms-screenshot')

  await browser.close()
}

async function changelog() {
  console.log('\n[changelog] default theme, 1440x900 @2x, full app view')
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' })
  const page = await ctx.newPage()
  await enterDemo(page, 'default')
  await dismissTip(page)

  await page.screenshot({ path: path.join(CHANGELOG_DIR, 'proptracker-accounts-tab.png') })
  console.log('  Saved: proptracker-accounts-tab.png')

  await page.getByRole('tab', { name: /Performance/ }).click()
  await page.waitForTimeout(1500)
  await scrollApp(page, 235)
  await page.screenshot({ path: path.join(CHANGELOG_DIR, 'proptracker-performance-tab.png') })
  console.log('  Saved: proptracker-performance-tab.png')

  await page.getByRole('tab', { name: /AI Coach/ }).click()
  await page.waitForTimeout(1500)
  await scrollApp(page, 220)
  await page.screenshot({ path: path.join(CHANGELOG_DIR, 'proptracker-coach-tab.png') })
  console.log('  Saved: proptracker-coach-tab.png')

  // Balance dialog with the live drawdown preview
  await page.getByRole('tab', { name: /Accounts/ }).click()
  await page.waitForTimeout(600)
  await scrollApp(page, 0)
  await page.getByRole('button', { name: /Update balance/ }).first().click()
  await page.waitForTimeout(700)
  await page.locator('#bal-current').fill('105200')
  await page.locator('#bal-today-pnl').fill('-1140')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(CHANGELOG_DIR, 'proptracker-balance-preview.png') })
  console.log('  Saved: proptracker-balance-preview.png')

  await browser.close()
}

async function main() {
  if (which === 'both' || which === 'landing') await landing()
  if (which === 'both' || which === 'changelog') await changelog()
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
