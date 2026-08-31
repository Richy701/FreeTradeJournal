// Verify the demo banner no longer animates: capture it twice 2s apart
// and require identical pixels. Usage: node e2e/harness/verify-banner-static.mjs <outDir>
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

const PORT = Number(process.env.PORT ?? 5301)
const server = await preview({
  root,
  preview: { port: PORT, strictPort: true },
  logLevel: 'error',
})

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(15000)

try {
  await page.goto(`http://localhost:${PORT}/`)
  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(3000) // banner slides in after 500ms; let everything settle

  const banner = page.getByText("You're viewing a live demo").locator('xpath=ancestor::div[contains(@class,"fixed")]')
  const a = path.join(outDir, 'banner-frame-a.png')
  const b = path.join(outDir, 'banner-frame-b.png')
  await banner.screenshot({ path: a })
  await page.waitForTimeout(2000)
  await banner.screenshot({ path: b })

  const same = fs.readFileSync(a).equals(fs.readFileSync(b))
  console.log(same ? 'STATIC: frames identical, no animation' : 'ANIMATING: frames differ')
  await page.screenshot({ path: path.join(outDir, 'dashboard-with-banner.png') })
  process.exitCode = same ? 0 : 1
} finally {
  await browser.close()
  await server.close()
}
