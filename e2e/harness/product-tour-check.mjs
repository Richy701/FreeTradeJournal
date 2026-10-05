// node e2e/harness/product-tour-check.mjs
// Landing page product tour: autoplay advances, a click takes over and stops
// autoplay, keyboard arrows move tabs, no horizontal overflow on phones, and
// reduced motion never autoplays. Saves frames for a visual check.
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
const out = path.resolve(process.env.OUT || '/tmp/ftj-product-tour')
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
        s.transformIndexHtml(req.url, `<!doctype html><html class="${dark ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body class="bg-background text-foreground"><div id="root"></div><script type="module" src="/e2e/harness/import-overlay-fixture.tsx"></script></body></html>`).then((html) => res.end(html))
      })
    },
  }],
  resolve: {
    alias: [
      { find: '@/contexts/theme-presets', replacement: stub('theme-presets.ts') },
      { find: '@/contexts/settings-context', replacement: stub('settings-context.ts') },
      { find: '@/contexts/auth-context', replacement: stub('auth-context.ts') },
      { find: '@', replacement: path.resolve(root, 'src') },
    ],
  },
  optimizeDeps: { entries: ['e2e/harness/import-overlay-fixture.tsx'] },
  server: { port: PORT },
  logLevel: 'error',
})
await server.listen()
const base = `http://localhost:${PORT}/__fixture?view=tour`
const selected = (page) => page.locator('[role="tab"][aria-selected="true"]').innerText()

const browser = await chromium.launch()
const errors = []
try {
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 })
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`))
    await page.goto(`${base}&theme=${theme}`)
    await page.locator('#tour-panel img:not([aria-hidden])').waitFor()
    await page.waitForLoadState('networkidle')
    assert.equal(await selected(page), 'Dashboard')
    await page.waitForTimeout(2700)
    await page.screenshot({ path: `${out}/${theme}-dashboard-progress-half.png` })
    await page.mouse.move(5, 995) // keep the pointer off the tour so autoplay runs
    await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent === 'Trade Log', null, { timeout: 4000 })
    await page.waitForTimeout(250)
    await page.screenshot({ path: `${out}/${theme}-crossfade-mid.png` })
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/${theme}-trade-log.png` })
    console.log(`${theme}: autoplay advanced Dashboard -> Trade Log`)

    await page.getByRole('tab', { name: 'PropTracker' }).click()
    await page.mouse.move(5, 995)
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${out}/${theme}-proptracker.png` })
    await page.waitForTimeout(6500)
    assert.equal(await selected(page), 'PropTracker', 'autoplay should stop after a click')
    await page.getByRole('tab', { name: 'PropTracker' }).press('ArrowRight')
    assert.equal(await selected(page), 'Dashboard', 'ArrowRight wraps to the first tab')
    console.log(`${theme}: click stops autoplay, arrows move between tabs`)
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 375, height: 800 }, deviceScaleFactor: 2 })
    await page.goto(`${base}&theme=dark`)
    await page.locator('#tour-panel img:not([aria-hidden])').waitFor()
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    assert.equal(overflow, false, 'no horizontal overflow at 375px')
    await page.screenshot({ path: `${out}/mobile-375.png` })
    console.log('375px: no horizontal overflow')
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' })
    await page.goto(`${base}&theme=dark`)
    await page.locator('#tour-panel img:not([aria-hidden])').waitFor()
    await page.mouse.move(5, 995)
    await page.waitForTimeout(6500)
    assert.equal(await selected(page), 'Dashboard', 'reduced motion: no autoplay')
    console.log('reduced motion: stays on Dashboard')
    await page.close()
  }

  assert.deepEqual(errors, [], 'page errors')
  console.log(`PASS — frames in ${out}`)
} finally {
  await browser.close()
  await server.close()
}
