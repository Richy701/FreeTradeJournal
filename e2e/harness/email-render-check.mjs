// Screenshot a rendered email HTML file at 640px so a template change can be
// eyeballed without sending anything.
//   node e2e/harness/email-render-check.mjs <in.html> <out.png>
import { chromium } from 'playwright'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
const [html, out] = process.argv.slice(2)
if (!html || !out) { console.error('usage: email-render-check.mjs <in.html> <out.png>'); process.exit(1) }
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 640, height: 900 } })
await page.goto(pathToFileURL(resolve(html)).href)
await page.waitForTimeout(300)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(`wrote ${out}`)
