// Measure the landing header at phone width, with the current font and with the pre-Geist system font.
import { chromium } from 'playwright'
const url = process.argv[2] || 'https://freetradejournal.com/'
const browser = await chromium.launch({ headless: true })
for (const width of [430, 400, 390, 375, 360]) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)
  const measure = () => page.evaluate(() => {
    const header = document.querySelector('header')
    const link = header.querySelector('a[href="/"]')
    const span = link.querySelector('span')
    const nav = link.nextElementSibling
    const r = (el) => { const b = el.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width) } }
    return { font: getComputedStyle(span).fontFamily.split(',')[0], vw: document.documentElement.clientWidth, doc: document.documentElement.scrollWidth, link: r(link), wordmark: r(span), nav: r(nav) }
  })
  console.log(`@${width} current:`, JSON.stringify(await measure()))
  await page.addStyleTag({ content: 'header a[href="/"] span { font-family: -apple-system, system-ui, sans-serif !important }' })
  await page.waitForTimeout(300)
  console.log(`@${width} system font:`, JSON.stringify(await measure()))
  await page.close()
}
await browser.close()
