// Screenshot the Actionable Ideas card on /ideas in demo mode: the What's New
// image to public/screenshots plus a copy and the text to <outDir>.
// Usage: node e2e/harness/insights-ideas-check.mjs <outDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]; if (!outDir) process.exit(2)
fs.mkdirSync(outDir, { recursive: true })
const PORT = 5296
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
  await page.evaluate(() => { window.history.pushState({}, '', '/ideas'); window.dispatchEvent(new PopStateEvent('popstate')) })
  const card = page.getByText('Actionable Ideas', { exact: true }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
  await card.waitFor({ state: 'visible' })
  await page.waitForTimeout(1200)
  await card.scrollIntoViewIfNeeded()
  await card.screenshot({ path: path.join(outDir, 'ideas-current.png') })
  await card.screenshot({ path: path.join(root, 'public/screenshots/insights-actionable-ideas.png') })
  console.log(await card.locator('p').allInnerTexts().then(t => t.join('\n')))
  await browser.close(); await server.close(); process.exit(0)
} catch (e) { console.error('harness error:', e.message); await browser.close(); await server.close(); process.exit(2) }
