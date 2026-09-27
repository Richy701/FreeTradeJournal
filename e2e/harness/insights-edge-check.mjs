// Visual check for the Trade Insights "Hold Time" and "Cost of Trading" cards
// in demo mode. Writes the What's New screenshot (dark, desktop) to
// public/screenshots and a phone-width review shot to the given directory.
// Usage: node e2e/harness/insights-edge-check.mjs <reviewDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const reviewDir = process.argv[2]
if (!reviewDir) { console.error('reviewDir required'); process.exit(2) }
fs.mkdirSync(reviewDir, { recursive: true })
const SHIP = path.join(root, 'public/screenshots/insights-hold-time-costs.png')

const PORT = 5297
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()

async function openInsights(width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 })
  page.setDefaultTimeout(20000)
  await page.addInitScript(() => { localStorage.setItem('ftj-theme', 'dark') })
  await page.goto(`http://localhost:${PORT}/`)
  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  // In-app navigation: a full page load would drop the demo session, and the
  // sidebar link is behind a sheet at phone width, so drive the router directly.
  await page.evaluate(() => { window.history.pushState({}, '', '/ideas'); window.dispatchEvent(new PopStateEvent('popstate')) })
  await page.waitForURL('**/ideas')
  try {
    await page.getByText('Hold Time', { exact: true }).waitFor({ state: 'visible' })
  } catch (e) {
    const headings = await page.locator('h1, h2, [class*="uppercase"]').allInnerTexts()
    console.error('page headings:', JSON.stringify(headings.slice(0, 20)))
    await page.screenshot({ path: path.join(reviewDir, 'insights-debug.png'), fullPage: true })
    throw e
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  return page
}

try {
  const desktop = await openInsights(1440)
  assert.ok(await desktop.getByText('Cost of Trading', { exact: true }).isVisible(), 'cost card renders in demo')
  assert.ok(await desktop.getByText('Typical winner').isVisible(), 'hold-time ledger renders')
  const grid = desktop.getByText('Hold Time', { exact: true }).locator('xpath=ancestor::div[contains(@class,"grid")][1]')
  await grid.scrollIntoViewIfNeeded()
  await desktop.waitForTimeout(600)
  await grid.screenshot({ path: SHIP })
  const box = await grid.boundingBox()
  console.log('captured ship', `${Math.round(box.width)}x${Math.round(box.height)}`, SHIP)
  await desktop.close()

  const mobile = await openInsights(390)
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  assert.equal(overflow, false, 'no horizontal overflow at 390px')
  const mgrid = mobile.getByText('Hold Time', { exact: true }).locator('xpath=ancestor::div[contains(@class,"grid")][1]')
  await mgrid.scrollIntoViewIfNeeded()
  await mobile.waitForTimeout(600)
  await mgrid.screenshot({ path: path.join(reviewDir, 'insights-edge-390.png') })
  console.log('captured mobile review shot')
  await mobile.close()

  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
