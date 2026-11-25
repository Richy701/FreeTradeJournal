import { chromium, type Page, type Locator } from 'playwright'
import { createServer } from 'vite'
import sharp from 'sharp'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

// A separate local presentation of Alex Morgan's fictional account.
// Uses actual app components and retains all demo write guards.
const OUTPUT_DIR = path.resolve('public/images/screenshots')
const screenshotWidths: Record<string, number> = {}
const screenshotHeights: Record<string, number> = {}
const base = 'http://localhost:5299'
const preview = process.argv.includes('--preview')
const server = await createServer({ server: { port: 5299, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({ headless: !preview })
await mkdir(OUTPUT_DIR, { recursive: true })

async function capture(page: Page, name: string, mode: string, target?: Locator | Locator[]) {
  await closeSidebar(page)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  let png: Buffer
  if (target) {
    const anchor = Array.isArray(target) ? target[0] : target
    await anchor.scrollIntoViewIfNeeded()
    const box = await anchor.boundingBox()
    if (!box) throw new Error('Capture target is not visible')
    await page.setViewportSize({ width: 1440, height: Math.max(920, Math.ceil(box.height) + 120) })
    await page.locator('main').first().evaluate((el, y) => { el.scrollTop += y - 100 }, box.y)
  }
  await page.mouse.move(0, 0)
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  if (await page.locator('[data-state="expanded"][data-collapsible]').count()) throw new Error('Sidebar must be closed for captures')
  png = await page.screenshot({ animations: 'disabled' })
  const file = path.join(OUTPUT_DIR, `${name}-${mode}`)
  const metadata = await sharp(png).metadata()
  screenshotWidths[`${name}-${mode}`] = metadata.width!
  screenshotHeights[`${name}-${mode}`] = metadata.height!
  await sharp(png).webp({ quality: 92 }).toFile(`${file}.webp`)
  for (const width of [640, 1280]) {
    await sharp(png).resize({ width }).webp({ quality: 88 }).toFile(`${file}-${width}w.webp`)
  }
  console.log(`Captured ${name} ${mode}`)
  await page.setViewportSize({ width: 1440, height: 920 })
}
async function closeSidebar(page: Page) {
  if (await page.locator('[data-state="expanded"][data-collapsible]').count()) {
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).first().click()
    await page.waitForTimeout(300)
  }
}
async function go(page: Page, route: string) {
  if (await page.locator('[data-state="collapsed"][data-collapsible]').count()) {
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).first().click()
  }
  await page.locator(`a[href="${route}"]`).first().click()
  await page.waitForURL(base + route)
  await page.waitForTimeout(1200)
  await page.locator('main').first().evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }))
}
const widget = (page: Page, label: string) => page.getByRole('button', { name: `Move ${label}`, exact: true }).locator('..')
try {
  for (const mode of ['light', 'dark'] as const) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 2, colorScheme: mode, reducedMotion: 'reduce' })
    await page.addInitScript(mode => {
      localStorage.setItem('ftj-theme', mode)
      sessionStorage.setItem('ftj-screenshot-preview', 'alex-morgan')
      sessionStorage.setItem('demo-banner-dismissed', 'true')
      localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }))
    }, mode)
    await page.goto(base)
    await page.getByRole('button', { name: 'View Live Demo', exact: true }).click()
    await page.waitForURL('**/dashboard')
    await page.getByRole('button', { name: 'Account menu', exact: true }).waitFor()
    await page.getByText('Alex Morgan', { exact: true }).waitFor()
    const promotion = page.getByRole('status').filter({ hasText: 'Prop firm deals' })
    if (await promotion.isVisible()) await promotion.getByRole('button', { name: 'Dismiss', exact: true }).click()
    await widget(page, 'Key metrics').waitFor()
    if (preview) {
      await closeSidebar(page)
      console.log('Alex Morgan preview ready. Browse any page or change theme. Close the browser when finished.')
      await new Promise<void>(resolve => browser.once('disconnected', resolve))
      break
    }
    await page.locator('main').first().evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }))
    await capture(page, 'trading-dashboard-screenshot', mode)
    await capture(page, 'dashboard-trades-performance-screenshot', mode, widget(page, 'Pairs performance'))
    await capture(page, 'equity-curve-screenshot', mode, widget(page, 'Equity curve'))
    await capture(page, 'calendar-heatmap-screenshot', mode, widget(page, 'Trading calendar'))
    for (const [route, name] of [
      ['/trades', 'trading-log-screenshot'], ['/journal', 'trading-journal-screenshot'],
      ['/goals', 'goals-risk-management-screenshot'], ['/ideas', 'trade-insights-screenshot'],
    ]) {
      await go(page, route)
      await capture(page, name, mode)
    }
    await capture(page, 'trade-insights-ideas-screenshot', mode, page.locator('#insights-actions'))
    await go(page, '/coach')
    await page.getByRole('button', { name: /AI Trade Analysis/ }).click()
    await page.locator('#trade-analysis').getByText('Performance Snapshot', { exact: true }).waitFor()
    await page.locator('#trade-analysis [aria-label$="% win rate"]').waitFor()
    await capture(page, 'ai-trade-analysis-screenshot', mode, page.locator('#trade-analysis'))
    await go(page, '/prop-tracker')
    await page.locator('[data-prop-account]').first().waitFor()
    await capture(page, 'prop-tracker-screenshot', mode)
    await page.getByRole('tab', { name: 'Performance', exact: true }).click()
    await page.getByRole('tab', { name: 'Performance', exact: true }).scrollIntoViewIfNeeded()
    await capture(page, 'prop-tracker-performance-screenshot', mode)
    await page.close()
  }
  if (!preview) await writeFile('src/data/landing-screenshot-sizes.ts', '// Generated by scripts/take-screenshots.ts. Pixel widths of the original captures.\nexport const SCREENSHOT_WIDTHS: Record<string, number> = ' + JSON.stringify(screenshotWidths, null, 2) + '\nexport const SCREENSHOT_HEIGHTS: Record<string, number> = ' + JSON.stringify(screenshotHeights, null, 2) + '\n')
} finally {
  await browser.close()
  await server.close()
}
