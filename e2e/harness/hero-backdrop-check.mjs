// Screenshots the marketing pages that share the landing hero backdrop
// (pricing, blog, changelog) in both themes at desktop and phone widths, and
// fails on horizontal overflow or page errors.
// Usage: node e2e/harness/hero-backdrop-check.mjs <outDir>
import { createServer } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })
const server = await createServer({ root: process.cwd(), server: { port: 5304, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
const failures = []
for (const route of ['/pricing', '/blog', '/changelog', '/documentation', '/privacy', '/terms', '/cookie-policy', '/blog/ai-trading-coach']) {
  for (const theme of ['dark', 'light']) {
    for (const vp of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', (e) => { if (!/tradingview/.test(e.stack || '')) errors.push(e.message) })
      await page.addInitScript((t) => {
        localStorage.setItem('ftj-theme', t)
        localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }))
      }, theme)
      await page.goto(`http://localhost:5304${route}`)
      await page.waitForTimeout(1800)
      const name = `${route.slice(1).replace(/\//g, '_')}-${theme}-${vp.width}`
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push(`${name}: overflow`)
      if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`)
      await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false })
      console.log('captured', name)
      await page.close()
    }
  }
}
await browser.close(); await server.close()
if (failures.length) { console.error('FAILURES:\n' + failures.join('\n')); process.exit(1) }
console.log('all good'); process.exit(0)
