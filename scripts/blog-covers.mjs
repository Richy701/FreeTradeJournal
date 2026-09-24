// Builds the 16:9 blog cover images from the marketing screenshots in
// public/images/screenshots. Each cover is a cropped detail of the relevant
// screen so it still reads at card size (a whole dashboard shrunk to a
// thumbnail is just a dark rectangle). Re-run after the screenshots change:
//   node scripts/blog-covers.mjs
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Sources live in two places: the CleanShot marketing set (public/images/
// screenshots/<name>-screenshot.png) and the changelog captures
// (public/screenshots/<name>.png). A leading "changelog:" picks the latter.
const src = (name) =>
  name.startsWith('changelog:')
    ? path.join(root, 'public/screenshots', `${name.slice('changelog:'.length)}.png`)
    : path.join(root, 'public/images/screenshots', `${name}-screenshot.png`)
const out = (slug) => path.join(root, 'public/images/blog', `${slug}.jpg`)

// left, top, width, height in source pixels; every box is 16:9.
const COVERS = {
  'ai-trading-coach':                    { from: 'ai-trade-analysis',   box: [330, 360, 1870, 1052] },
  'best-free-trading-journal-prop-firm': { from: 'trading-dashboard',   box: [240, 600, 2000, 1125] },
  'best-free-trading-journals-2026':     { from: 'dashboard-analytics', box: [284, 340, 2820, 1586] },
  'das-trader-import':                   { from: 'trading-log',         box: [287, 390, 2805, 1578] },
  'how-to-pass-topstep-combine':         { from: 'calendar-heatmap',    box: [287, 500, 2805, 1578] },
  'mt4-mt5-trading-journal':             { from: 'equity-curve',        box: [277, 180, 2200, 1237] },
  'prop-firm-tracker':                   { from: 'prop-tracker',        box: [390, 520, 2600, 1462] },
  'tradovate-ninjatrader-import':        { from: 'dashboard-trades-performance', box: [277, 260, 2200, 1237] },
  'broker-time-zone-imports':            { from: 'dashboard-analytics', box: [284, 1180, 1888, 1062] },
  'tag-your-setups':                     { from: 'changelog:tag-performance', box: [0, 0, 1660, 934] },
  'import-trades-from-a-screenshot':     { from: 'changelog:screenshot-import-review', box: [440, 520, 2130, 1198] },
  'journal-you-actually-open':           { from: 'trading-journal',     box: [284, 340, 2820, 1586] },
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
