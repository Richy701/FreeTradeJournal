// Screenshot the landing-page testimonials section (light + dark) for design review.
// Usage: node e2e/harness/testimonials-check.mjs   (starts its own vite preview on 4173)
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'

const OUT = process.env.SHOT_DIR || '/tmp/testimonials-check'
fs.mkdirSync(OUT, { recursive: true })

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
  cwd: new URL('../..', import.meta.url).pathname,
  stdio: 'ignore',
})
await new Promise((r) => setTimeout(r, 2500))

try {
  const browser = await chromium.launch({ headless: true })
  for (const colorScheme of ['dark', 'light']) {
    for (const [label, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport, colorScheme })
      // The app reads its theme from localStorage, not prefers-color-scheme
      await page.addInitScript((mode) => { localStorage.setItem('ftj-theme', mode) }, colorScheme)
      await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(3000)
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 200))
        }
      })
      const heading = page.getByText('Real results from', { exact: false }).first()
      try {
        await heading.waitFor({ timeout: 15000 })
      } catch {
        console.error(`testimonials section not found (${colorScheme}/${label})`)
        await page.close()
        continue
      }
      const section = heading.locator('xpath=ancestor::section[1]')
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(800)
      await section.screenshot({ path: `${OUT}/testimonials-${colorScheme}-${label}.png` })
      await page.close()
    }
  }
  await browser.close()
  console.log(`Saved to ${OUT}`)
} finally {
  preview.kill()
}
