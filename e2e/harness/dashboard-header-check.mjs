// Read-only visual check: screenshot the dashboard greeting header (date,
// greeting, stat line) in demo mode — dark desktop, dark mobile, light desktop.
// Usage: node e2e/harness/dashboard-header-check.mjs <outDir>
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

const PORT = 5299
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()

const shots = [
  { name: 'dark-desktop', width: 1440, theme: 'dark' },
  { name: 'dark-mobile', width: 390, theme: 'dark' },
  { name: 'light-desktop', width: 1440, theme: 'light' },
]

try {
  for (const s of shots) {
    const page = await browser.newPage({ viewport: { width: s.width, height: 900 }, deviceScaleFactor: 2 })
    page.setDefaultTimeout(15000)
    await page.addInitScript((t) => { localStorage.setItem('ftj-theme', t) }, s.theme)
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
    const header = page.locator('h1').first().locator('xpath=ancestor::div[contains(@class,"border-b")][1]')
    await header.screenshot({ path: path.join(outDir, `header-${s.name}.png`) })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    console.log('captured', s.name, overflow ? '(HORIZONTAL OVERFLOW)' : '')
    await page.close()
  }
  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
