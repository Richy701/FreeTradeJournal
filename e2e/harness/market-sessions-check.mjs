// Read-only visual check: screenshot the Market Sessions dashboard widget in
// demo mode — dark desktop, light desktop, dark mobile.
// Usage: node e2e/harness/market-sessions-check.mjs <outDir> [fixed ISO time, e.g. 2026-09-29T14:30:00Z]
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
const fixedTime = process.argv[3] ? new Date(process.argv[3]) : null
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5298
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()

const shots = [
  { name: 'dark-desktop', width: 1440, theme: 'dark' },
  { name: 'light-desktop', width: 1440, theme: 'light' },
  { name: 'dark-mobile', width: 390, theme: 'dark' },
]

try {
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.width, height: 1000 }, deviceScaleFactor: 2 })
    page.setDefaultTimeout(20000)
    await page.addInitScript((t) => { localStorage.setItem('ftj-theme', t) }, s.theme)
    if (fixedTime) await page.clock.setFixedTime(fixedTime)
    await page.goto(`http://localhost:${PORT}/`)
    await page.getByText('View Live Demo').first().click()
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(3500)
    await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
    if (s.theme === 'light') {
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
      await page.waitForTimeout(800)
    }
    const widget = page.getByText('Market Sessions', { exact: true }).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    await widget.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await widget.screenshot({ path: path.join(outDir, `sessions-${s.name}.png`) })
    const box = await widget.boundingBox()
    console.log('captured', s.name, box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '')
    await page.close()
  }
  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
