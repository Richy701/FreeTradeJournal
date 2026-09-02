// Full-page landing captures for audit: dark+light desktop, dark mobile.
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'

const OUT = process.env.SHOT_DIR || '/tmp/landing-full'
fs.mkdirSync(OUT, { recursive: true })
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: '/Users/richy/FreeTradeJournal',
  stdio: 'ignore',
})
await new Promise((r) => setTimeout(r, 2500))
try {
  const browser = await chromium.launch({ headless: true })
  const runs = [
    ['dark', 'desktop', { width: 1440, height: 900 }],
    ['light', 'desktop', { width: 1440, height: 900 }],
    ['dark', 'mobile', { width: 390, height: 844 }],
  ]
  for (const [mode, label, viewport] of runs) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
    await page.addInitScript((m) => {
      localStorage.setItem('ftj-theme', m)
      localStorage.setItem('cookieConsent', JSON.stringify({ version: 1, analytics: false, updatedAt: Date.now(), decidedAt: Date.now() }))
    }, mode)
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 150))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1500)
    // Hide the cookie banner if it survived the pre-consent
    await page.addStyleTag({ content: '[data-cookie-banner], .cookie-consent { display:none !important }' })
    const h = await page.evaluate(() => document.body.scrollHeight)
    console.log(mode, label, 'height', h)
    await page.screenshot({ path: `${OUT}/${mode}-${label}-top.png` })
    // Chunked full-page: slices of viewport height so each is readable
    const step = viewport.height
    let i = 0
    for (let y = 0; y < h; y += step) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y)
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${OUT}/${mode}-${label}-${String(i++).padStart(2, '0')}.png` })
    }
    await page.close()
  }
  await browser.close()
} finally {
  preview.kill()
}
