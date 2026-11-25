// Builds the 16:9 blog cover images from the marketing screenshots in
// public/images/screenshots. Each cover is a cropped detail of the relevant
// screen so it still reads at card size (a whole dashboard shrunk to a
// thumbnail is just a dark rectangle). Re-run after the screenshots change:
//   node scripts/blog-covers.mjs
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Sources live in two places: the dark marketing set (public/images/
// screenshots/<name>-screenshot-dark.webp, 2880 wide) and the changelog
// captures (public/screenshots/<name>.png). A leading "changelog:" picks the
// latter.
const src = (name) =>
  name.startsWith('changelog:')
    ? path.join(root, 'public/screenshots', `${name.slice('changelog:'.length)}.png`)
    : path.join(root, 'public/images/screenshots', `${name}-screenshot-dark.webp`)
const out = (slug) => path.join(root, 'public/images/blog', `${slug}.jpg`)

// left, top, width, height in source pixels; every box is 16:9.
const COVERS = {
  'ai-trading-coach':                    { from: 'ai-trade-analysis',   box: [40, 200, 2800, 1575] },
  'best-free-trading-journal-prop-firm': { from: 'trading-dashboard',   box: [60, 470, 2070, 1164] },
  'best-free-trading-journals-2026':     { from: 'trading-dashboard',   box: [60, 160, 2760, 1552] },
  'das-trader-import':                   { from: 'trading-log',         box: [72, 300, 2736, 1539] },
  'how-to-pass-topstep-combine':         { from: 'calendar-heatmap',    box: [40, 340, 2800, 1575] },
  'mt4-mt5-trading-journal':             { from: 'equity-curve',        box: [40, 170, 2800, 1575] },
  'prop-firm-tracker':                   { from: 'prop-tracker',        box: [50, 276, 2780, 1564] },
  'tradovate-ninjatrader-import':        { from: 'dashboard-trades-performance', box: [40, 170, 2800, 1575] },
  'broker-time-zone-imports':            { from: 'trading-dashboard',   box: [80, 940, 1600, 900] },
  'tag-your-setups':                     { from: 'changelog:tag-performance', box: [0, 0, 1660, 934] },
  'import-trades-from-a-screenshot':     { from: 'changelog:screenshot-import-review', box: [440, 520, 2130, 1198] },
  'journal-you-actually-open':           { from: 'trading-journal',     box: [40, 175, 2800, 1575] },
}

for (const [slug, { from, box }] of Object.entries(COVERS)) {
  const [left, top, width, height] = box
  await sharp(src(from))
    .extract({ left, top, width, height })
    .resize(1600, 900, { fit: 'cover' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out(slug))
  console.log('wrote', path.relative(root, out(slug)))
}
