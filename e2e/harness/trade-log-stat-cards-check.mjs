// Screenshot the Trade Log quick-stat cards (P&L sparkline, win-rate ring,
// best/worst bars, R:R gauge) in demo mode for the What's New entry.
// Usage: node e2e/harness/trade-log-stat-cards-check.mjs <outDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]; if (!outDir) process.exit(2)
fs.mkdirSync(outDir, { recursive: true })
const PORT = 5295
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
  page.setDefaultTimeout(20000)
  await page.addInitScript(() => { localStorage.setItem('ftj-theme', 'dark') })
  await page.goto(`http://localhost:${PORT}/`)
  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  await page.evaluate(() => { window.history.pushState({}, '', '/trades'); window.dispatchEvent(new PopStateEvent('popstate')) })
  const anchor = page.getByText(/per trade$/).first()
  await anchor.waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  const grid = anchor.locator('xpath=ancestor::div[contains(@class,"grid")][1]')
  await grid.scrollIntoViewIfNeeded()
  await grid.screenshot({ path: path.join(outDir, 'trade-log-stat-cards.png') })
  await grid.screenshot({ path: path.join(root, 'public/screenshots/trade-log-stat-cards.png') })
  const box = await grid.boundingBox()
  console.log('captured', box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '')
  await browser.close(); await server.close(); process.exit(0)
} catch (e) { console.error('harness error:', e.message); await browser.close(); await server.close(); process.exit(2) }
