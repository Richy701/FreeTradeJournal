/**
 * Marketing screenshot refresh captured through CleanShot X, so every shot
 * gets the styled window treatment (backdrop, padding, rounded corners)
 * configured in CleanShot Settings > Screenshots > Window capture.
 *
 * The script stages each page exactly like take-marketing-screenshots.ts
 * (gold "Deep Yellow" preset via selected-theme=monochrome, dark mode, demo
 * data, breadcrumb header hidden) in a visible chrome-less app-mode window,
 * then fires `cleanshot://capture-window`. You click the FreeTradeJournal
 * window once per shot; the saved Desktop file is picked up, moved into
 * public/images/screenshots/ and the WebP variants (full, 1280w, 640w) are
 * regenerated.
 *
 * CleanShot must be set to auto-save captures to ~/Desktop.
 *
 * Usage: npm run dev (in another terminal), then
 *   npx tsx scripts/take-marketing-screenshots-cleanshot.ts [name ...]
 * With no args every shot is taken; pass base names to do a subset.
 * Pass "og" (alone or with names) to also rebuild public/og-image.png from
 * the trading-dashboard capture.
 */
import { chromium, type Page } from 'playwright'
import sharp from 'sharp'
import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve('public/images/screenshots')
// Where CleanShot auto-saves captures. Desktop is TCC-protected for some
// terminal processes; point CLEANSHOT_SAVE_DIR at CleanShot's save folder.
const SAVE_DIR = process.env.CLEANSHOT_SAVE_DIR || path.join(os.homedir(), 'Desktop')

type Shot = {
  name: string
  route: string
  /** Heading text to scroll to; omit for top-of-page */
  scrollTo?: string
  /** Viewport (window content) height in CSS px */
  height: number
  /** Viewport width override (default 1280) */
  width?: number
  prep?: (page: Page) => Promise<void>
}

const SHOTS: Shot[] = [
  { name: 'trading-dashboard-screenshot', route: '/dashboard', height: 796 },
  { name: 'dashboard-trades-performance-screenshot', route: '/dashboard', scrollTo: 'Recent Trades', height: 796 },
  { name: 'equity-curve-screenshot', route: '/dashboard', scrollTo: 'Equity Curve', height: 796 },
  { name: 'calendar-heatmap-screenshot', route: '/dashboard', scrollTo: 'Trading Calendar', height: 796,
    // A fresh month means an empty grid; step back to the last full demo month
    prep: async (page) => {
      await page.evaluate(() => {
        const title = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent?.trim() === 'Trading Calendar')
        const card = title?.closest('[class*="card"], .rounded-xl') ?? undefined
        const btns = card ? [...card.querySelectorAll('button')] : []
        ;(btns[0] as HTMLButtonElement | undefined)?.click()
      })
      await page.waitForTimeout(1200)
    } },
  { name: 'trading-log-screenshot', route: '/trades', height: 796 },
  { name: 'trading-journal-screenshot', route: '/journal', height: 796 },
  { name: 'goals-risk-management-screenshot', route: '/goals', height: 1001, width: 1800 },
  { name: 'trade-insights-screenshot', route: '/ideas', height: 796 },
  { name: 'trade-insights-ideas-screenshot', route: '/ideas', scrollTo: 'Weekly P&L Trend', height: 796 },
  { name: 'ai-trade-analysis-screenshot', route: '/ideas', scrollTo: 'AI Trade Analysis', height: 735 },
  { name: 'prop-tracker-screenshot', route: '/prop-tracker', height: 722 },
  { name: 'prop-tracker-firms-screenshot', route: '/prop-tracker', height: 756,
    prep: async (page) => {
      await page.evaluate(() => {
        const grid = [...document.querySelectorAll<HTMLElement>('[role="tabpanel"][data-state="active"] .grid')].at(-1)
        grid?.scrollIntoView({ block: 'start' })
        const scroller = [...document.querySelectorAll<HTMLElement>('*')].find(
          e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 50,
        )
        if (scroller) scroller.scrollTop -= 12
      })
      await page.waitForTimeout(600)
    } },
]

const args = process.argv.slice(2)
const wantOg = args.includes('og')
const only = args.filter(a => a !== 'og')

function trigger(url: string) {
  execSync(`open "${url}"`)
}

function desktopPngs(): Map<string, number> {
  const map = new Map<string, number>()
  for (const f of fs.readdirSync(SAVE_DIR)) {
    if (f.toLowerCase().endsWith('.png')) map.set(f, fs.statSync(path.join(SAVE_DIR, f)).mtimeMs)
  }
  return map
}

async function waitForNewPng(before: Map<string, number>, timeoutMs = 300000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    for (const f of fs.readdirSync(SAVE_DIR)) {
      if (!f.toLowerCase().endsWith('.png')) continue
      const p = path.join(SAVE_DIR, f)
      const m = fs.statSync(p).mtimeMs
      if (!before.has(f) || before.get(f)! < m - 1) {
        // wait until the file size is stable so we never read a partial write
        let size = -1
        for (;;) {
          const s = fs.statSync(p).size
          if (s === size && s > 0) return p
          size = s
          await new Promise(r => setTimeout(r, 400))
        }
      }
    }
    await new Promise(r => setTimeout(r, 400))
  }
  throw new Error('No new capture appeared on the Desktop. Is CleanShot set to auto-save captures to Desktop?')
}

async function webpVariants(pngPath: string, baseName: string) {
  await sharp(pngPath).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}.webp`))
  await sharp(pngPath).resize(1280).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}-1280w.webp`))
  await sharp(pngPath).resize(640).webp({ quality: 80 }).toFile(path.join(OUT_DIR, `${baseName}-640w.webp`))
}

async function enterDemo(page: Page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => {
    localStorage.setItem('selected-theme', 'monochrome')
    localStorage.setItem('ftj-theme', 'dark')
    localStorage.setItem('ftj-dismiss-deals', '1')
    localStorage.setItem('ftj-dismiss-deals-pt', '1')
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
}

async function dismissChrome(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    for (const b of document.querySelectorAll('button')) {
      const t = b.textContent ?? ''
      if (/got it|dismiss tip|decline/i.test(t)) (b as HTMLButtonElement).click()
    }
    // Marketing framing: no breadcrumb header, no demo banner
    if (!document.getElementById('shot-style')) {
      const s = document.createElement('style')
      s.id = 'shot-style'
      s.textContent = 'header{display:none!important}[class*="demo-banner"]{display:none!important}'
      document.head.appendChild(s)
    }
  })
  await page.waitForTimeout(300)
}

// The app scrolls inside SidebarInset, not the window
async function scrollToTarget(page: Page, text?: string): Promise<boolean> {
  return page.evaluate((text) => {
    const scroller = [...document.querySelectorAll<HTMLElement>('*')].find(
      e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 50,
    )
    if (!text) {
      if (scroller) scroller.scrollTop = 0
      return true
    }
    const el = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,span,div')]
      .filter(e => e.children.length <= 2 && (e.textContent ?? '').trim().toLowerCase() === text.toLowerCase())
      .at(0)
    if (!el) return false
    const card = el.closest('[class*="card"], .rounded-xl, .rounded-lg') ?? el
    card.scrollIntoView({ block: 'start' })
    if (scroller) scroller.scrollTop -= 16
    return true
  }, text)
}

async function setInnerSize(page: Page, width: number, height: number) {
  const cdp = await page.context().newCDPSession(page)
  const { windowId } = await cdp.send('Browser.getWindowForTarget') as { windowId: number }
  for (let i = 0; i < 3; i++) {
    const inner = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
    if (inner.w === width && inner.h === height) break
    const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId }) as { bounds: { width: number, height: number } }
    await cdp.send('Browser.setWindowBounds', {
      windowId,
      bounds: { left: 20, top: 40, width: bounds.width + (width - inner.w), height: bounds.height + (height - inner.h) },
    })
    await page.waitForTimeout(500)
  }
  await cdp.detach()
}

async function buildOgImage() {
  const src = path.join(OUT_DIR, 'trading-dashboard-screenshot.png')
  if (!fs.existsSync(src)) throw new Error('trading-dashboard-screenshot.png not found; capture it first')
  const og = path.resolve('public/og-image.png')
  await sharp(src).resize(3600, 2262, { fit: 'cover' }).png().toFile(og)
  await sharp(src).resize(3600, 2262, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.resolve('public/og-image.webp'))
  console.log('  Saved: og-image.png + og-image.webp (3600x2262)')
}

async function main() {
  const todo = SHOTS.filter(s => !only.length || only.includes(s.name))
  if (!todo.length && wantOg) { await buildOgImage(); return }
  if (!todo.length) { console.error('No matching shot names.'); process.exit(1) }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ftj-shots-'))
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: null,
    colorScheme: 'dark',
    ignoreDefaultArgs: ['--enable-automation'],
    args: [`--app=${BASE_URL}/`, '--window-position=20,40', '--window-size=1280,880'],
  })
  const page = ctx.pages()[0] ?? await ctx.newPage()
  await enterDemo(page)

  console.log(`\n${todo.length} shot(s). When the CleanShot crosshair appears, click the FreeTradeJournal window once.\n`)

  for (const shot of todo) {
    await setInnerSize(page, shot.width ?? 1280, shot.height)
    await page.evaluate((route) => {
      window.history.pushState({}, '', route)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, shot.route)
    await page.waitForTimeout(2500)
    await dismissChrome(page)
    if (shot.prep) await shot.prep(page)
    if (!(await scrollToTarget(page, shot.scrollTo))) {
      console.error(`  !! target "${shot.scrollTo}" not found for ${shot.name} — skipped`)
      continue
    }
    await page.waitForTimeout(900)

    // Clean title bar for marketing shots (the SPA sets a long SEO title)
    await page.evaluate(() => { document.title = 'FreeTradeJournal' })
    console.log(`>> ${shot.name}: click the window now`)
    const before = desktopPngs()
    trigger('cleanshot://capture-window')
    const captured = await waitForNewPng(before)
    await page.waitForTimeout(300)

    const dest = path.join(OUT_DIR, `${shot.name}.png`)
    fs.copyFileSync(captured, dest)
    fs.unlinkSync(captured)
    await webpVariants(dest, shot.name)
    const meta = await sharp(dest).metadata()
    console.log(`  Saved: ${shot.name} (${meta.width}x${meta.height})`)
  }

  await ctx.close()
  if (wantOg) await buildOgImage()
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
