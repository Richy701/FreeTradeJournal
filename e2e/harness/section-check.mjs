import { chromium } from 'playwright'
import { spawn } from 'child_process'
const OUT = '/private/tmp/claude-501/-Users-richy-FreeTradeJournal/3587fa00-fecf-49c2-bb5a-55005d0f3f15/scratchpad/sections'
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true })
const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: '/Users/richy/FreeTradeJournal', stdio: 'ignore' })
await new Promise(r => setTimeout(r, 2500))
try {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, colorScheme: 'dark' })
  await page.goto('http://localhost:4174/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3500)
  // dismiss cookie card so it doesn't cover sections
  await page.locator('button', { hasText: 'Decline' }).first().click({ timeout: 3000 }).catch(() => {})
  for (const [name, text] of [['logo-cloud', 'Trusted by traders at'], ['bento', 'Real-Time Metrics']]) {
    const el = page.locator(`text=${text}`).first()
    await el.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => console.error('missing: ' + name))
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/${name}.png` })
  }
  await browser.close()
  console.log('done')
} finally { preview.kill() }
