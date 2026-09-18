// Audit of public information pages: how wide the content block is and how
// many characters fit on a line of body text. Readability guidance: 50-75
// characters per line (Baymard), 80 max (WCAG 1.4.8).
// Run: node e2e/harness/content-width-audit.mjs   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 4333;
const ROUTES = (process.argv[2] || '/privacy,/terms,/cookie-policy,/documentation,/changelog,/blog,/ftmo-review,/the5ers-review,/top-one-futures-review,/tradezella-alternative,/tradersync-alternative,/edgewonk-alternative,/forex-trading-journal,/futures-trading-tracker,/day-trading-journal,/online-trading-journal,/prop-firm-dashboard,/prop-tracker,/position-size-calculator,/ftmo-trading-journal,/affiliate,/pricing').split(',');
const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true, open: false } });
const browser = await chromium.launch();
const rows = [];
try {
  for (const width of [1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    for (const route of ROUTES) {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(900);
      rows.push({ width, route, ...(await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const paras = [...main.querySelectorAll('p, li')].filter((el) => {
          const t = (el.textContent || '').trim();
          return t.length > 140 && !el.closest('header, footer, nav') && el.getClientRects().length;
        });
        if (!paras.length) return { paragraphs: 0 };
        const ctx = document.createElement('canvas').getContext('2d');
        const stats = paras.map((el) => {
          const cs = getComputedStyle(el);
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const text = (el.textContent || '').trim();
          const perChar = ctx.measureText(text).width / text.length;
          return { w: el.getBoundingClientRect().width, cpl: Math.round(el.getBoundingClientRect().width / perChar), size: parseFloat(cs.fontSize) };
        });
        const cpl = stats.map((s) => s.cpl).sort((a, b) => a - b);
        // Widest block that holds the page's own content (not full-bleed wrappers).
        const blocks = [...main.querySelectorAll('div, section, article')].map((el) => el.getBoundingClientRect().width).filter((w) => w < window.innerWidth - 40);
        return {
          paragraphs: paras.length,
          contentWidth: Math.round(Math.max(...blocks, 0)),
          textWidthMax: Math.round(Math.max(...stats.map((s) => s.w))),
          fontSize: stats[0].size,
          cplMedian: cpl[Math.floor(cpl.length / 2)],
          cplMax: cpl[cpl.length - 1],
        };
      })) });
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log('viewport | route | content block px | widest text px | font px | chars/line median | chars/line max');
for (const r of rows) console.log(`${r.width} | ${r.route} | ${r.contentWidth ?? '-'} | ${r.textWidthMax ?? '-'} | ${r.fontSize ?? '-'} | ${r.cplMedian ?? '-'} | ${r.cplMax ?? '-'}`);
