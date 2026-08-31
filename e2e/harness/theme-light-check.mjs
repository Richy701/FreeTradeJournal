// Read-only visual check: screenshot the dashboard in LIGHT mode with given
// theme presets applied. Enters demo for data, then strips the demo flag so
// ThemePresetsProvider applies the preset (demo mode normally disables them).
// Usage: node e2e/harness/theme-light-check.mjs <outDir> [preset ...]
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
const presets = process.argv.slice(3)
if (!presets.length) presets.push('default', 'monochrome', 'ice', 'crimson', 'sunset')
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5298
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()

try {
  for (const preset of presets) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(15000)
    await page.addInitScript((p) => {
      localStorage.setItem('ftj-theme', 'light')
      localStorage.setItem('selected-theme', p)
      localStorage.removeItem('theme-vars-cache')
    }, preset)
    await page.goto(`http://localhost:${PORT}/`)
    await page.getByText('View Live Demo').first().click()
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(3500)
    await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
    // Demo disables presets; drop the flag so the provider applies this one
    await page.evaluate(() => {
      delete document.documentElement.dataset.demo
      document.documentElement.classList.remove('dark')
    })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(outDir, `light-${preset}.png`) })
    console.log('captured', preset)
    await page.close()
  }
  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
