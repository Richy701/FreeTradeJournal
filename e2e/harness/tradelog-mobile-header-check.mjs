// Verify the Trade Log header action grid on a mobile viewport:
// the $/% toggle should fill its grid cell like the three buttons.
// Usage: node e2e/harness/tradelog-mobile-header-check.mjs <outDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5298
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)
await page.goto(`http://localhost:${PORT}/`)
await page.waitForLoadState('networkidle').catch(() => {})
await page.waitForTimeout(2000)
await page.getByText('View Live Demo').first().click()
await page.waitForURL('**/dashboard')
await page.waitForTimeout(3000)
await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
await page.evaluate(() => {
  window.history.pushState({}, '', '/trades')
  window.dispatchEvent(new PopStateEvent('popstate'))
})
await page.waitForSelector('h1:has-text("Trade Log")')
await page.waitForTimeout(1500)

const widths = await page.evaluate(() => {
  const grid = document.querySelector('h1')?.closest('.flex.flex-col')?.querySelector('.grid')
  if (!grid) return null
  return [...grid.children]
    .filter((c) => c.tagName !== 'INPUT')
    .map((c) => ({ w: Math.round(c.getBoundingClientRect().width), text: c.textContent?.trim().slice(0, 12) }))
})
console.log('grid cells:', widths)
const header = page.locator('h1:has-text("Trade Log")').locator('xpath=ancestor::div[contains(@class,"border-b")]')
await header.first().screenshot({ path: path.join(outDir, 'tradelog-mobile-header.png') })

const ws = (widths || []).map((c) => c.w)
const even = ws.length >= 4 && Math.max(...ws) - Math.min(...ws) <= 2
console.log(even ? 'HEADER GRID PASS' : 'HEADER GRID FAIL')
await browser.close()
await server.close()
process.exit(even ? 0 : 1)
