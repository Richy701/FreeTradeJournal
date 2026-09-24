// Renders public/og-lifetime-drop.png (1200x630) for the /lifetime-drop link
// preview: dark card, the price in big type, the open time under it. Re-run
// after the open with OPEN=1 to swap the kicker for the closing time.
// Usage: node e2e/harness/lifetime-drop-og.mjs [outPath]
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const out = process.argv[2] || path.join(root, 'public/og-lifetime-drop.png')
const open = process.env.OPEN === '1'
// Inline the logo: file:// images do not load inside setContent.
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/favicon-64x64.png')).toString('base64')

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;background:#0b0b0d;font-family:Geist,system-ui,sans-serif;color:#fff}
  .card{position:relative;width:1200px;height:630px;overflow:hidden;background:
    radial-gradient(900px 500px at 18% -10%, rgba(245,158,11,.22), transparent 60%),
    radial-gradient(700px 420px at 100% 110%, rgba(245,158,11,.14), transparent 60%),#0b0b0d}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:60px 60px}
  .inner{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:26px;letter-spacing:-.01em}
  .brand img{width:40px;height:40px;border-radius:10px}
  .kicker{font-size:20px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#f59e0b}
  .time{font-size:118px;font-weight:800;letter-spacing:-.05em;line-height:.95;margin:14px 0 18px}
  .time span{color:#f59e0b}
  .sub{font-size:34px;font-weight:500;color:rgba(255,255,255,.72);letter-spacing:-.01em}
  .pill{display:inline-flex;align-items:center;gap:12px;border:1px solid rgba(245,158,11,.4);background:rgba(245,158,11,.12);border-radius:999px;padding:12px 22px;font-size:22px;font-weight:700}
  .pill b{background:#f59e0b;color:#000;border-radius:999px;padding:4px 12px;font-size:16px;letter-spacing:.14em;text-transform:uppercase}
  .row{display:flex;align-items:flex-end;justify-content:space-between}
</style></head><body><div class="card"><div class="grid"></div><div class="inner">
  <div class="brand"><img src="${logo}"> FreeTradeJournal</div>
  <div>
    <div class="kicker">${open ? 'Doors open. Closes Fri 2 Oct' : 'Friday 25 September, 9:30 AM New York'}</div>
    <div class="time">Lifetime Pro <span>$199</span></div>
    <div class="sub">Back for one week. Pay once, keep every Pro feature for good.</div>
  </div>
  <div class="row"><div class="pill"><b>${open ? 'Closes' : 'Opens'}</b> ${open ? 'Fri 2 Oct, 11:59 PM New York' : 'Fri 25 Sep, 9:30 AM New York'}</div></div>
</div></div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({ path: out, type: 'png' })
await browser.close()
console.log('wrote', out)
