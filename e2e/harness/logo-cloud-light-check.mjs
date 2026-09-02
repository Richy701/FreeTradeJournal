import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'
const OUT = '/private/tmp/claude-501/-Users-richy-FreeTradeJournal/3587fa00-fecf-49c2-bb5a-55005d0f3f15/scratchpad/sections'
fs.mkdirSync(OUT, { recursive: true })
const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: '/Users/richy/FreeTradeJournal', stdio: 'ignore' })
await new Promise(r => setTimeout(r, 2500))
try {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 700 } })
  await page.goto('http://localhost:4174/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => localStorage.setItem('ftj-theme', 'light'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  await page.locator('button', { hasText: 'Decline' }).first().click({ timeout: 3000 }).catch(() => {})
  const el = page.locator('text=Trusted by traders at').first()
  await el.scrollIntoViewIfNeeded({ timeout: 10000 })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/logos-light-real.png` })
  await browser.close()
  console.log('done')
} finally { preview.kill() }
