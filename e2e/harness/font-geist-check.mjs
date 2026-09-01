// Verify the Geist rollout: font file loads, computed styles use it,
// and capture landing + dashboard + trades in dark and light for eyeballing.
// Usage: node e2e/harness/font-geist-check.mjs <outDir>
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
const server = await preview({
  root,
  preview: { port: PORT, strictPort: true },
  logLevel: 'error',
})

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(15000)

const fontReport = async (label) => {
  const r = await page.evaluate(async () => {
    await document.fonts.ready
    const loaded = document.fonts.check('600 16px Geist')
    const body = getComputedStyle(document.body).fontFamily
    const h = document.querySelector('h1, h2')
    const heading = h ? getComputedStyle(h).fontFamily : '(no heading)'
    return { loaded, body, heading }
  })
  console.log(`[${label}] Geist loaded: ${r.loaded} | body: ${r.body} | heading: ${r.heading}`)
  return r.loaded && /Geist/.test(r.body)
}

let ok = true
try {
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2000)
  ok = (await fontReport('landing')) && ok
  await page.screenshot({ path: path.join(outDir, 'landing.png') })

  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.waitForTimeout(4000)
  await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  ok = (await fontReport('dashboard-dark')) && ok
  await page.screenshot({ path: path.join(outDir, 'dashboard-dark.png') })

  // light mode
  await page.emulateMedia({ colorScheme: 'light' })
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('vite-ui-theme', 'light')
  })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(outDir, 'dashboard-light.png') })

  await page.evaluate(() => {
    window.history.pushState({}, '', '/trades')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForTimeout(2500)
  ok = (await fontReport('trades-light')) && ok
  await page.screenshot({ path: path.join(outDir, 'trades-light.png') })

  await browser.close()
  await server.close()
  console.log(ok ? 'FONT CHECK PASS' : 'FONT CHECK FAIL')
  process.exit(ok ? 0 : 1)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close()
  await server.close()
  process.exit(2)
}
