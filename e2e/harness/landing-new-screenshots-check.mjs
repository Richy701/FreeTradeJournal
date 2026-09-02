// Verify the refreshed marketing screenshots render correctly on the landing page.
// Usage: npx vite preview --port 4173 (or this script starts one), then
//   node e2e/harness/landing-new-screenshots-check.mjs
import { chromium } from 'playwright'
import { spawn } from 'child_process'

const OUT = process.env.SHOT_DIR || '/tmp/landing-check'
import fs from 'fs'
fs.mkdirSync(OUT, { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: new URL('../..', import.meta.url).pathname,
  stdio: 'ignore',
})
await new Promise(r => setTimeout(r, 2500))

try {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(4000)

  await page.screenshot({ path: `${OUT}/landing-hero.png` })

  // First pass: sweep the page so lazy sections mount
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 250))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(1500)

  const targets = ['Dashboard Performance', 'Trade Log View', 'Trade Insights', 'PropTracker']
  for (const alt of targets) {
    const img = page.locator(`img[alt="${alt}"]`).first()
    try {
      await img.scrollIntoViewIfNeeded({ timeout: 8000 })
    } catch {
      console.error(`not found: ${alt}`)
      continue
    }
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${OUT}/landing-${alt.toLowerCase().replace(/\s+/g, '-')}.png` })
  }
  await browser.close()
  console.log(`Saved checks to ${OUT}`)
} finally {
  preview.kill()
}
