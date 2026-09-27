// Read-only visual check: screenshot the Trade Log table in demo mode at desktop
// widths, to confirm columns spread across the row (Actions column right-aligned,
// no dead strip on the right). Usage: node e2e/harness/trade-log-table-check.mjs <outDir>
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

try {
  for (const [width, theme] of [[1920, 'light'], [1440, 'light'], [1920, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    page.setDefaultTimeout(15000)
    await page.addInitScript((t) => { localStorage.setItem('ftj-theme', t) }, theme)
    await page.goto(`http://localhost:${PORT}/`)
    await page.getByText('View Live Demo').first().click()
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
    await page.locator('a[href="/trades"]').first().click()
    await page.waitForURL('**/trades')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2500)
    await page.screenshot({ path: path.join(outDir, `trade-log-top-${width}-${theme}.png`) })
    const table = page.locator('table').first()
    await table.waitFor().catch(async (e) => {
      await page.screenshot({ path: path.join(outDir, `debug-${width}.png`), fullPage: true })
      console.log('url at failure:', page.url())
      throw e
    })
    // Column edges of the first data row, for the report
    const edges = await table.evaluate((t) => {
      const row = t.querySelector('tbody tr')
      const cells = [...row.querySelectorAll('td')]
      const tr = t.getBoundingClientRect()
      return { tableRight: Math.round(tr.right), cells: cells.map((c) => [Math.round(c.getBoundingClientRect().left), Math.round(c.getBoundingClientRect().right)]) }
    })
    console.log(width, JSON.stringify(edges))
    await table.screenshot({ path: path.join(outDir, `trade-log-table-${width}-${theme}.png`) })
    await page.close()
  }
  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(1)
}
