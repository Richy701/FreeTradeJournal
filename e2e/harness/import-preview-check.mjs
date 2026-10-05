// node e2e/harness/import-preview-check.mjs
// Screenshots the shared import preview dialog in each state (new trades,
// nothing new, unreadable rows, blocked, single trade) in both themes and at
// phone width, and checks the copy never contradicts itself, the list holds
// every new trade and the running P&L curve draws.
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'
import path from 'node:path'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const stub = (f) => path.resolve(__dirname, 'import-overlay-stubs', f)
const PORT = 5208
const out = path.resolve(process.env.OUT || '/tmp/ftj-import-preview')
mkdirSync(out, { recursive: true })

const server = await createServer({
  root,
  configFile: false,
  plugins: [react(), {
    name: 'fixture-html',
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/__fixture')) return next()
        const dark = req.url.includes('theme=dark')
        res.setHeader('Content-Type', 'text/html')
        s.transformIndexHtml(req.url, `<!doctype html><html class="${dark ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body class="bg-background text-foreground"><div id="root"></div><script type="module" src="/e2e/harness/import-preview-fixture.tsx"></script></body></html>`).then((html) => res.end(html))
      })
    },
  }],
  resolve: {
    alias: [
      { find: '@/contexts/theme-presets', replacement: stub('theme-presets.ts') },
      { find: '@/contexts/settings-context', replacement: stub('settings-context.ts') },
      { find: '@', replacement: path.resolve(root, 'src') },
    ],
  },
  optimizeDeps: { entries: ['e2e/harness/import-preview-fixture.tsx'] },
  server: { port: PORT },
  logLevel: 'error',
})
await server.listen()
const base = `http://localhost:${PORT}/__fixture`

const browser = await chromium.launch()
const errors = []
try {
  const open = async (scenario, theme, viewport) => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${base}?scenario=${scenario}&theme=${theme}`)
    await page.getByRole('dialog').waitFor()
    await page.waitForTimeout(350)
    return page
  }

  for (const theme of ['light', 'dark']) {
    for (const scenario of ['new', 'none', 'errors', 'blocked', 'one']) {
      const page = await open(scenario, theme, { width: 1280, height: 800 })
      await page.screenshot({ path: `${out}/${theme}-${scenario}.png` })
      const dialog = page.getByRole('dialog')
      const text = await dialog.innerText()
      assert.ok(!/\dT\d\d:\d\d/.test(text), 'no raw ISO timestamps')

      if (scenario === 'new') {
        assert.equal(await dialog.getByRole('heading').innerText(), 'Import 127 trades')
        assert.match(text, /Jan 28 – Feb 12, 2026/)
        assert.match(text, /139 trades in file/)
        assert.match(text, /127 new/)
        assert.match(text, /12 already in journal/)
        assert.equal(await dialog.locator('tbody tr').count(), 127, 'every new trade is listed')
        assert.equal(await dialog.locator('.recharts-line-curve').count(), 1, 'running P&L curve drawn')
        // The header stays put while the list scrolls.
        const headTop = () => dialog.locator('thead th').first().evaluate((el) => Math.round(el.getBoundingClientRect().top))
        const before = await headTop()
        await dialog.locator('tbody tr').nth(40).scrollIntoViewIfNeeded()
        assert.equal(await headTop(), before, 'sticky table header')
        await dialog.locator('tbody tr').first().scrollIntoViewIfNeeded()
        assert.ok(await dialog.getByRole('button', { name: 'Import 127 trades' }).isEnabled())
        // Numbers line up on the right edge of their column.
        const rights = await dialog.locator('tbody tr td:last-child').evaluateAll((els) => els.map((el) => {
          const r = document.createRange(); r.selectNodeContents(el); return Math.round(r.getBoundingClientRect().right)
        }))
        assert.equal(new Set(rights).size, 1, `P&L column right-aligned: ${rights}`)
        const clipped = await dialog.locator('.truncate').evaluateAll((els) => els.filter((el) => el.offsetParent && el.scrollWidth > el.clientWidth).map((el) => el.textContent))
        assert.deepEqual(clipped, [], 'no caption cut off with an ellipsis')
        const box = await dialog.boundingBox()
        assert.ok(box.width <= 680, `dialog width ${box.width}`)
      }
      if (scenario === 'none') {
        assert.equal(await dialog.getByRole('heading').innerText(), 'Nothing new to import')
        assert.match(text, /All 139 trades in this file are already in your journal, so nothing was added\./)
        assert.match(text, /139 already in your journal/)
        assert.equal(await dialog.locator('table').count(), 0, 'no trade table when nothing is new')
        assert.ok((await dialog.boundingBox()).width <= 460, 'compact width')
        assert.ok(!/will be imported|Import 0/i.test(text), 'no contradictory import copy')
        assert.equal(await dialog.getByRole('button', { name: /^Import/ }).count(), 0)
        assert.equal(await dialog.getByRole('button', { name: 'Close' }).first().isVisible(), true)
      }
      if (scenario === 'errors') {
        assert.match(text, /3 rows couldn't be read and will be skipped/)
        assert.match(text, /3 unreadable/)
      }
      if (scenario === 'blocked') {
        assert.equal(await dialog.getByRole('heading').innerText(), "Can't import this file yet")
        assert.ok(await dialog.getByRole('button', { name: /^Import/ }).isDisabled())
      }
      if (scenario === 'one') {
        assert.equal(await dialog.getByRole('heading').innerText(), 'Import 1 trade')
      }
      await page.close()
    }
  }

  for (const scenario of ['new', 'none', 'errors']) {
    const page = await open(scenario, 'dark', { width: 375, height: 740 })
    await page.screenshot({ path: `${out}/mobile-${scenario}.png` })
    const overflow = await page.getByRole('dialog').evaluate((el) => el.scrollWidth - el.clientWidth)
    const clipped = await page.getByRole('dialog').locator('.truncate').evaluateAll((els) => els.filter((el) => el.offsetParent && el.scrollWidth > el.clientWidth).map((el) => el.textContent))
    assert.deepEqual(clipped, [], 'no caption cut off with an ellipsis on phone')
    assert.ok(overflow <= 0, `no sideways overflow on phone (${overflow}px)`)
    await page.close()
  }

  assert.deepEqual(errors, [], 'page errors')
  console.log(`PASS — screenshots in ${out}`)
} finally {
  await browser.close()
  await server.close()
}
