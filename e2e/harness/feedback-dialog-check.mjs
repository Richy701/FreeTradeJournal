// Read-only visual check: open the feedback dialog from the sidebar in demo
// mode and screenshot it — dark desktop, light desktop, dark mobile.
// Usage: node e2e/harness/feedback-dialog-check.mjs <outDir>
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
    await page.goto(`http://localhost:${PORT}/`)
    await page.getByText('View Live Demo').first().click()
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(3000)
    await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
    if (s.theme === 'light') {
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
      await page.waitForTimeout(500)
    }
    // The sidebar button is hidden in demo mode; fire the same window event
    // the email deep link and the footer link use (src/lib/feedback-trigger.ts).
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('ftj:open-feedback', { detail: { context: 'Dashboard' } })))
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    await page.waitForTimeout(600)
    await dialog.screenshot({ path: path.join(outDir, `feedback-${s.name}.png`) })
    // Bug variant shows diagnostics + screenshot rows
    if (s.name === 'dark-desktop') {
      await dialog.getByRole('button', { name: 'Bug' }).click()
      await page.waitForTimeout(400)
      await dialog.screenshot({ path: path.join(outDir, `feedback-${s.name}-bug.png`) })
    }
    console.log('captured', s.name)
    await page.close()
  }
  await browser.close(); await server.close(); process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
