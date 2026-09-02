/**
 * Styled marketing screenshot refresh, fully automated (no manual capture).
 *
 * Stages each page exactly like take-marketing-screenshots.ts (gold "Deep
 * Yellow" preset via selected-theme=monochrome, dark mode, demo data,
 * breadcrumb bar cropped, deviceScaleFactor 2), then composes each flat
 * capture onto a styled 16:9 canvas: warm dark gradient backdrop, rounded
 * corners, soft drop shadow — the CleanShot-window look, but scripted so the
 * whole set is deterministic and rerunnable.
 *
 * Every output is 2880x1620 (16:9), so the landing pages' aspect-video +
 * object-cover containers render them without layout changes.
 *
 * Usage: npm run dev (in another terminal), then
 *   npx tsx scripts/take-marketing-screenshots-styled.ts [name ...] [og]
 * With no args every shot is retaken; pass base names to redo a subset.
 * "og" also rebuilds public/og-image.png from the trading-dashboard shot.
 */
import { chromium, type Page } from 'playwright'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import os from 'os'

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve('public/images/screenshots')

// Styled canvas (16:9) and framing, all in @2x pixels
const CANVAS_W = 2880
const CANVAS_H = 1620
const PAD = 112
const RADIUS = 28

type Shot = {
  name: string
  route: string
  /** Heading text to scroll to; omit for top-of-page */
  scrollTo?: string
  /** Clip height in CSS px (width is the viewport) */
  height: number
  /** Viewport width override (default 1280) */
  width?: number
  prep?: (page: Page) => Promise<void>
  /** Clip to this element's bounding box instead of the viewport */
  element?: string
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
    element: '[role="tabpanel"][data-state="active"] .grid' },
]

const argv = process.argv.slice(2)
const wantOg = argv.includes('og')
const only = argv.filter(a => a !== 'og')

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
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    const gotIt = [...document.querySelectorAll('button')].find(b => /got it/i.test(b.textContent ?? ''))
    gotIt?.click()
  })
  await page.waitForTimeout(400)
}

async function dismissChrome(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--demo-banner-height', '0px')
    for (const b of document.querySelectorAll('button')) {
      const t = b.textContent ?? ''
      if (/got it|dismiss tip|decline/i.test(t)) (b as HTMLButtonElement).click()
    }
    // Local dev has no market-data keys; keep the outage notice out of shots
    for (const el of document.querySelectorAll<HTMLElement>('*')) {
      if (el.children.length === 0 && /market data is temporarily unavailable/i.test(el.textContent ?? '')) {
        ;(el.closest('[class*="alert"], [role="alert"], p, div') as HTMLElement | null)?.style.setProperty('display', 'none', 'important')
      }
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

/** Compose a flat @2x capture onto the styled 16:9 canvas */
async function styleCapture(flatPng: Buffer): Promise<Buffer> {
  const meta = await sharp(flatPng).metadata()
  const srcW = meta.width!
  const srcH = meta.height!
  const scale = Math.min((CANVAS_W - 2 * PAD) / srcW, (CANVAS_H - 2 * PAD) / srcH)
  const w = Math.round(srcW * scale)
  const h = Math.round(srcH * scale)
  const left = Math.round((CANVAS_W - w) / 2)
  const top = Math.round((CANVAS_H - h) / 2)

  const backdrop = Buffer.from(`
    <svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2b2214"/>
          <stop offset="45%" stop-color="#1a150d"/>
          <stop offset="100%" stop-color="#0d0b07"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="8%" r="75%">
          <stop offset="0%" stop-color="#d4a94f" stop-opacity="0.16"/>
          <stop offset="55%" stop-color="#d4a94f" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="#d4a94f" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="34"/>
        </filter>
      </defs>
      <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bg)"/>
      <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#glow)"/>
      <rect x="${left}" y="${top + 22}" width="${w}" height="${h}" rx="${RADIUS}" fill="#000" fill-opacity="0.55" filter="url(#shadow)"/>
    </svg>`)

  const mask = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" rx="${RADIUS}" fill="#fff"/>
    </svg>`)
  const border = Buffer.from(`
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${RADIUS}" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2"/>
    </svg>`)

  const card = await sharp(flatPng)
    .resize(w, h)
    .ensureAlpha()
    .composite([
      { input: mask, blend: 'dest-in' },
      { input: border, blend: 'over' },
    ])
    .png()
    .toBuffer()

  return sharp(backdrop)
    .composite([{ input: card, left, top }])
    .png()
    .toBuffer()
}

async function saveWithVariants(styled: Buffer, baseName: string) {
  const pngPath = path.join(OUT_DIR, `${baseName}.png`)
  await sharp(styled).png().toFile(pngPath)
  await sharp(styled).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}.webp`))
  await sharp(styled).resize(1280).webp({ quality: 85 }).toFile(path.join(OUT_DIR, `${baseName}-1280w.webp`))
  await sharp(styled).resize(640).webp({ quality: 80 }).toFile(path.join(OUT_DIR, `${baseName}-640w.webp`))
}

async function buildOgImage() {
  const src = path.join(OUT_DIR, 'trading-dashboard-screenshot.png')
  if (!fs.existsSync(src)) throw new Error('trading-dashboard-screenshot.png not found; capture it first')
  await sharp(src).resize(3600, 2262, { fit: 'cover' }).png().toFile(path.resolve('public/og-image.png'))
  await sharp(src).resize(3600, 2262, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.resolve('public/og-image.webp'))
  console.log('  Saved: og-image.png + og-image.webp (3600x2262)')
}

async function main() {
  const todo = SHOTS.filter(s => !only.length || only.includes(s.name))
  if (!todo.length && wantOg) { await buildOgImage(); return }
  if (!todo.length) { console.error('No matching shot names.'); process.exit(1) }

  const browser = await chromium.launch({ headless: true })
  const widths = [...new Set(todo.map(s => s.width ?? 1280))]

  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 2, colorScheme: 'dark' })
    const page = ctx.pages()[0] ?? await ctx.newPage()
    await enterDemo(page)

    for (const shot of todo) {
      if ((shot.width ?? 1280) !== width) continue
      await page.evaluate((route) => {
        window.history.pushState({}, '', route)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, shot.route)
      await page.waitForTimeout(2500)
      await dismissChrome(page)
      if (shot.prep) await shot.prep(page)

      let clip: { x: number, y: number, width: number, height: number }
      if (shot.element) {
        const grid = page.locator(shot.element).last()
        await grid.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        const box = await grid.boundingBox()
        if (!box) { console.error(`  !! element not found for ${shot.name}`); continue }
        clip = {
          x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 12),
          width: Math.min(width, box.width + 32),
          height: Math.min(box.height + 24, 1200 - Math.max(0, box.y - 12)),
        }
      } else {
        const top = await scrollTargetTop(page, shot.scrollTo)
        if (top < 0) { console.error(`  !! target "${shot.scrollTo}" not found for ${shot.name}`); continue }
        await page.waitForTimeout(900)
        clip = { x: 0, y: top, width, height: Math.min(shot.height, 1200 - top) }
      }

      const flat = await page.screenshot({ clip })
      const styled = await styleCapture(flat)
      await saveWithVariants(styled, shot.name)
      console.log(`  Saved: ${shot.name} (styled ${CANVAS_W}x${CANVAS_H})`)
    }
    await ctx.close()
  }
  await browser.close()
  if (wantOg) await buildOgImage()
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
