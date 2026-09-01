/**
 * Full marketing screenshot refresh (public/images/screenshots/), one run.
 * Same recipe as take-prop-screenshots.ts: gold "Deep Yellow" preset
 * (selected-theme=monochrome), dark mode, demo data, breadcrumb bar cropped,
 * deviceScaleFactor 2, PNG + WebP (full, 1280w, 640w).
 *
 * Usage: npm run dev (in another terminal), then
 *   npx tsx scripts/take-marketing-screenshots.ts [name ...]
 * With no args every shot is retaken; pass base names to redo a subset.
 */
import { chromium, type Page } from 'playwright'
import sharp from 'sharp'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve('public/images/screenshots')

type Shot = {
  name: string
  route: string
  /** Heading text to scroll to; omit for top-of-page */
  scrollTo?: string
  /** Clip height in CSS px (width is the viewport) */
  height: number
  /** Viewport width override (default 1280) */
  width?: number
  /** Extra page prep after navigation (e.g. switch month) */
  prep?: (page: Page) => Promise<void>
}

const SHOTS: Shot[] = [
  { name: 'trading-dashboard-screenshot', route: '/dashboard', height: 796 },
  { name: 'dashboard-trades-performance-screenshot', route: '/dashboard', scrollTo: 'Recent Trades', height: 796 },
  { name: 'equity-curve-screenshot', route: '/dashboard', scrollTo: 'Equity Curve', height: 796 },
  { name: 'calendar-heatmap-screenshot', route: '/dashboard', scrollTo: 'Trading Calendar', height: 796,
    // A fresh month means an empty grid; step back to the last full demo month
    prep: async (page) => {
      const prev = page.locator('button:has(svg)').filter({ has: page.locator('svg') })
      await page.evaluate(() => {
        const title = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent?.trim() === 'Trading Calendar')
        const card = title?.closest('[class*="card"], .rounded-xl') ?? undefined
        const btns = card ? [...card.querySelectorAll('button')] : []
        ;(btns[0] as HTMLButtonElement | undefined)?.click()
      })
      await page.waitForTimeout(1200)
      void prev
    } },
  { name: 'trading-log-screenshot', route: '/trades', height: 796 },
  { name: 'trading-journal-screenshot', route: '/journal', height: 796 },
  { name: 'goals-risk-management-screenshot', route: '/goals', height: 1001, width: 1800 },
  { name: 'trade-insights-screenshot', route: '/ideas', height: 796 },
  { name: 'trade-insights-ideas-screenshot', route: '/ideas', scrollTo: 'Weekly P&L Trend', height: 796 },
  { name: 'ai-trade-analysis-screenshot', route: '/ideas', scrollTo: 'AI Trade Analysis', height: 735 },
]

const only = process.argv.slice(2)

async function enterDemo(page: Page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => {
    localStorage.setItem('selected-theme', 'monochrome')
    localStorage.setItem('ftj-theme', 'dark')
    localStorage.setItem('ftj-dismiss-deals', '1')
    localStorage.setItem('ftj-dismiss-tracker', '1')
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: true, marketing: false, timestamp: Date.now() }))
    sessionStorage.setItem('demo-banner-dismissed', 'true')
  })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(1500)
  const demoBtn = page.getByRole('button', { name: /Live Demo/i }).or(page.getByRole('link', { name: /Live Demo/i })).first()
  await demoBtn.click({ timeout: 10000 })
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  await page.waitForTimeout(3000)
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    const gotIt = [...document.querySelectorAll('button')].find(b => /got it/i.test(b.textContent ?? ''))
    gotIt?.click()
  })
  await page.waitForTimeout(400)
}

async function dismissChrome(page: Page) {
  // demo banner, tips, cookie card if any leaked through
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    for (const b of document.querySelectorAll('button')) {
      const t = b.textContent ?? ''
      if (/got it|dismiss tip|decline/i.test(t)) (b as HTMLButtonElement).click()
    }
  })
  await page.waitForTimeout(300)
}

// The app scrolls inside SidebarInset, not the window
async function scrollTargetTop(page: Page, text?: string): Promise<number> {
  return page.evaluate((text) => {
    const scroller = [...document.querySelectorAll<HTMLElement>('*')].find(
      e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 50,
    )
    const header = document.querySelector('header')
    const headerBottom = header ? Math.round(header.getBoundingClientRect().bottom) : 0
    if (!text) {
      if (scroller) scroller.scrollTop = 0
      return headerBottom
    }
    const el = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,span,div')]
      .filter(e => e.children.length <= 2 && (e.textContent ?? '').trim().toLowerCase() === text.toLowerCase())
      .at(0)
    if (!el) return -1
    const card = el.closest('[class*="card"], .rounded-xl, .rounded-lg') ?? el
    card.scrollIntoView({ block: 'start' })
    if (scroller) scroller.scrollTop -= headerBottom + 16 // keep the card clear of the sticky header
    return Math.max(headerBottom, Math.round(card.getBoundingClientRect().top))
  }, text)
}

async function webpVariants(pngPath: string, baseName: string) {
  await sharp(pngPath).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}.webp`))
  await sharp(pngPath).resize(1280).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}-1280w.webp`))
  await sharp(pngPath).resize(640).webp({ quality: 80 }).toFile(path.join(OUT_DIR, `${baseName}-640w.webp`))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const widths = [...new Set(SHOTS.filter(s => !only.length || only.includes(s.name)).map(s => s.width ?? 1280))]

  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 2, colorScheme: 'dark' })
    const page = ctx.pages()[0] ?? await ctx.newPage()
    await enterDemo(page)

    for (const shot of SHOTS) {
      if (only.length && !only.includes(shot.name)) continue
      if ((shot.width ?? 1280) !== width) continue
      await page.evaluate((route) => {
        window.history.pushState({}, '', route)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, shot.route)
      await page.waitForTimeout(2500)
      await dismissChrome(page)
      if (shot.prep) await shot.prep(page)
      const top = await scrollTargetTop(page, shot.scrollTo)
      if (top < 0) { console.error(`  !! target "${shot.scrollTo}" not found for ${shot.name}`); continue }
      await page.waitForTimeout(900)
      const png = path.join(OUT_DIR, `${shot.name}.png`)
      const height = Math.min(shot.height, 1200 - top)
      await page.screenshot({ path: png, clip: { x: 0, y: top, width, height } })
      await webpVariants(png, shot.name)
      console.log(`  Saved: ${shot.name} (${width}x${height} @2x)`)
    }
    await ctx.close()
  }
  await browser.close()
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
