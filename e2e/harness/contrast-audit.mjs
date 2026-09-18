// Dark-mode (or light-mode) text contrast audit for public pages.
// Reports text whose contrast against its real background is below WCAG AA
// (4.5:1 for normal text, 3:1 for large text: 24px+, or 18.66px+ bold).
// Colours with alpha are blended onto the nearest opaque background first.
// LIMIT=7 lists everything under the stricter AAA level (dim but legal text).
// Run: SCHEME=dark node e2e/harness/contrast-audit.mjs [routes]   (needs `npm run build` first)
import { preview } from 'vite';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCHEME = process.env.SCHEME || 'dark';
const ROUTES = (process.argv[2] || '/,/pricing,/ftmo-trading-journal,/forex-trading-journal,/ftmo-review,/tradezella-alternative,/privacy,/changelog').split(',');
const server = await preview({ root: ROOT, preview: { port: 4343, strictPort: true, open: false } });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: SCHEME });
await page.addInitScript((t) => { try { localStorage.setItem('ftj-theme', t); localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 })); } catch {} }, SCHEME);
try {
  for (const route of ROUTES) {
    await page.goto(`http://localhost:4343${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 260)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1200);
    const result = await page.evaluate(({ LIMIT, LIMIT_LARGE }) => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
      const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgOf = (el) => { const layers = []; for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; } } let base = { r: 3, g: 3, b: 3, a: 1 }; const root = parse(getComputedStyle(document.body).backgroundColor); if (root && root.a === 1) base = root; return layers.reverse().reduce((acc, c) => (c.a === 1 ? c : blend(c, acc)), base); };
      const groups = {}; let total = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode; const text = node.nodeValue.trim(); const el = node.parentElement;
        if (text.length < 3 || !el || el.closest('svg, script, style, [aria-hidden="true"]') || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        let opacity = 1; for (let n = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
        // Not yet animated into view, gradient-filled text, or text on a gradient /
        // image background: none of these can be judged from computed colours.
        if (opacity < 0.05 || cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || cs.color === 'rgba(0, 0, 0, 0)') continue;
        let onImage = false; for (let n = el; n; n = n.parentElement) { if (getComputedStyle(n).backgroundImage !== 'none') { onImage = true; break; } const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a === 1) break; }
        if (onImage) continue;
        const fg = parse(cs.color); if (!fg) continue; fg.a *= opacity;
        const bg = bgOf(el); const shown = blend(fg, bg);
        const ratio = (Math.max(lum(shown), lum(bg)) + 0.05) / (Math.min(lum(shown), lum(bg)) + 0.05);
        const size = parseFloat(cs.fontSize); const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
        total++;
        if (ratio < (large ? LIMIT_LARGE : LIMIT)) {
          const cls = (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\s+/).filter((c) => /^(text-|opacity-|dark:text-)/.test(c)).join(' ') || '(inherited)';
          const key = `${cls} | ${Math.round(size)}px`;
          groups[key] = groups[key] || { n: 0, worst: 99, sample: text.slice(0, 46) };
          groups[key].n++; groups[key].worst = Math.min(groups[key].worst, ratio);
        }
      }
      return { total, groups };
    }, { LIMIT: Number(process.env.LIMIT || 4.5), LIMIT_LARGE: Number(process.env.LIMIT_LARGE || 3) });
    const failing = Object.values(result.groups).reduce((s, g) => s + g.n, 0);
    console.log(`\n## ${route}  —  ${failing} of ${result.total} text runs below ${process.env.LIMIT || 4.5}:1`);
    for (const [k, g] of Object.entries(result.groups).sort((a, b) => b[1].n - a[1].n).slice(0, 9)) console.log(`   x${String(g.n).padEnd(3)} ${g.worst.toFixed(1)}:1  ${k}  e.g. "${g.sample}"`);
  }
} finally { await browser.close(); await server.close(); }
