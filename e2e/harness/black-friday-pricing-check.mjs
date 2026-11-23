// Black Friday 2026 pricing page check. Screenshots /pricing on the monthly
// and yearly tabs, dark and light, desktop and phone, with the clock pinned
// during the sale and after it closes, and fails if the sale shows when it
// should not or is missing when it should. Also leaves one page open across
// the closing instant and checks it flips on its own.
// Usage: node e2e/harness/black-friday-pricing-check.mjs <outDir>
import { createServer } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const DURING = new Date('2026-11-27T15:00:00Z')
const AFTER = new Date('2026-12-01T06:00:00Z')
const JUST_BEFORE_CLOSE = new Date('2026-12-01T04:59:30Z')
const server = await createServer({ root: process.cwd(), server: { port: 5305, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
const failures = []

async function openPricing({ time, tab, theme, vp }) {
  const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', (e) => { if (!/tradingview/.test(e.stack || '')) errors.push(e.message) })
  await page.clock.install({ time })
  await page.addInitScript((t) => {
    localStorage.setItem('ftj-theme', t)
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }))
  }, theme)
  await page.goto(`http://localhost:5305/pricing?plan=${tab}`)
  // The pinned clock fakes timers, not module loading: wait for the real
  // page before fast-forwarding animations.
  await page.waitForFunction(() => (document.querySelector('main')?.textContent || '').includes('Pro'), null, { timeout: 30_000 })
  await page.clock.runFor(2500)
  return { page, errors }
}

async function readState(page) {
  const body = (await page.locator('body').innerText()).toLowerCase()
  // NumberFlow draws prices in a shadow root, so innerText misses them. The
  // accessibility tree has them digit by digit ("$ 1 7 9"); join the digits.
  const cards = (await page.locator('main').ariaSnapshot()).replace(/(?<=[$\d.]) (?=[\d.])/g, '')
  const main = (await page.locator('main').innerText()) + ' ' + cards
  return {
    hero: body.includes('black friday · limited-time pricing'),
    timers: await page.locator('[role="timer"]').count(),
    lifetime: main.includes('Pro Lifetime'),
    yearlyDeal: main.includes('First year · then $99.99/year'),
    cents179: main.includes('$179.00'),
    has179: /\$179(?!\.)/.test(main),
    has7999: main.includes('$79.99'),
  }
}

for (const phase of ['during', 'after']) {
  for (const tab of ['monthly', 'yearly']) {
    for (const theme of ['dark', 'light']) {
      for (const vp of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
        const { page, errors } = await openPricing({ time: phase === 'during' ? DURING : AFTER, tab, theme, vp })
        const name = `${phase}-${tab}-${theme}-${vp.width}`
        const s = await readState(page)
        if (phase === 'during') {
          if (!s.hero) failures.push(`${name}: hero missing Black Friday line`)
          if (!s.lifetime) failures.push(`${name}: lifetime card missing`)
          if (!s.has179 || s.cents179) failures.push(`${name}: lifetime should read $179 (no cents)`)
          if (tab === 'yearly' && !(s.yearlyDeal && s.has7999)) failures.push(`${name}: yearly $79.99 deal missing`)
          if (s.timers !== (tab === 'yearly' ? 2 : 1)) failures.push(`${name}: expected ${tab === 'yearly' ? 2 : 1} countdowns, got ${s.timers}`)
        } else {
          if (s.hero) failures.push(`${name}: Black Friday still in hero after close`)
          if (s.lifetime) failures.push(`${name}: lifetime card still showing after close`)
          if (s.yearlyDeal || s.has7999) failures.push(`${name}: yearly deal still showing after close`)
          if (s.timers) failures.push(`${name}: countdown still showing after close`)
        }
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`${name}: overflow`)
        if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`)
        await page.locator('main section').first().screenshot({ path: path.join(outDir, `${name}-cards.png`) })
        console.log('captured', name, s)
        await page.close()
      }
    }
  }
}

// An open tab crossing the deadline must drop the sale without a reload.
{
  const { page, errors } = await openPricing({ time: JUST_BEFORE_CLOSE, tab: 'yearly', theme: 'dark', vp: { width: 1440, height: 1100 } })
  const before = await readState(page)
  await page.clock.runFor(60_000)
  const after = await readState(page)
  console.log('crossing', { before, after })
  if (!before.lifetime || !before.yearlyDeal) failures.push('crossing: sale not showing 30s before close')
  if (after.lifetime || after.yearlyDeal || after.hero || after.timers) failures.push('crossing: open tab still shows the sale after close')
  if (errors.length) failures.push(`crossing: ${errors.join(' | ')}`)
  await page.close()
}

await browser.close(); await server.close()
if (failures.length) { console.error('FAILURES:\n' + failures.join('\n')); process.exit(1) }
console.log('all good'); process.exit(0)
