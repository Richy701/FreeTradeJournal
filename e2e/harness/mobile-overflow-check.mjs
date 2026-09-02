// Find horizontal overflow on a page at phone width.
// Usage: node e2e/harness/mobile-overflow-check.mjs [url] [outDir]
//   default url = local vite preview on 4173 (started here)
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'

const url = process.argv[2] || 'http://localhost:4173/'
const OUT = process.argv[3] || '/tmp/mobile-overflow'
fs.mkdirSync(OUT, { recursive: true })

let preview
if (url.includes('localhost:4173')) {
  preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: new URL('../..', import.meta.url).pathname,
    stdio: 'ignore',
  })
  await new Promise((r) => setTimeout(r, 2500))
}

try {
  const browser = await chromium.launch({ headless: true })
  for (const width of [390, 375, 360]) {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })
    await page.addInitScript(() => { localStorage.setItem('ftj-theme', 'dark') })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3500)
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(800)
    const report = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const offenders = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el)
          if (cs.position === 'fixed') continue
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 90),
            left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40),
          })
        }
      }
      return {
        vw,
        innerWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        offenders: offenders.slice(0, 25),
        offenderCount: offenders.length,
      }
    })
    console.log(`\n=== ${url} @ ${width}px ===`)
    console.log(JSON.stringify({ vw: report.vw, innerWidth: report.innerWidth, docScrollWidth: report.docScrollWidth, bodyScrollWidth: report.bodyScrollWidth, offenderCount: report.offenderCount }))
    for (const o of report.offenders) console.log(`  <${o.tag}> [${o.left}..${o.right}] w=${o.w} "${o.text}" ${o.cls}`)
    await page.screenshot({ path: `${OUT}/top-${width}.png` })
    await page.close()
  }
  await browser.close()
} finally {
  preview?.kill()
}
