// node e2e/harness/import-overlay-check.mjs
// Captures frames of the import overlay (steps -> result -> close -> row glow),
// checks reduced motion skips straight to the result, and measures the hero
// stagger (each block should become visible after the one before it).
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
const PORT = 5207
const out = path.resolve(process.env.OUT || '/tmp/ftj-import-overlay')
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
const base = `http://localhost:${PORT}/__fixture`

const browser = await chromium.launch()
const errors = []
try {
  for (const theme of ['dark', 'light']) {
    for (const scenario of ['win', 'loss', 'none']) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 })
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`${base}?view=overlay&scenario=${scenario}&theme=${theme}`)
      await page.getByTestId('run').click()
      const t0 = Date.now()
      const shots = scenario === 'win' ? [150, 500, 850, 1200, 1500, 1800, 2400] : [2600]
      for (const ms of shots) {
        await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)))
        await page.screenshot({ path: `${out}/${theme}-${scenario}-${String(ms).padStart(4, '0')}ms.png` })
      }
      const result = page.getByRole('button', { name: 'Done' })
      await result.waitFor({ timeout: 4000 })
      if (scenario === 'win') {
        await page.waitForTimeout(900)
        assert.match(await page.getByText(/trades imported/).innerText(), /^47 trades imported$/)
        await result.click()
        await page.waitForTimeout(150)
        await page.screenshot({ path: `${out}/${theme}-glow-0150ms.png` })
        const bg = await page.getByTestId('row-0').evaluate((el) => getComputedStyle(el).backgroundColor)
        const bgOld = await page.getByTestId('row-3').evaluate((el) => getComputedStyle(el).backgroundColor)
        console.log(`${theme} glow row bg: ${bg} | untouched row bg: ${bgOld}`)
        assert.notEqual(bg, bgOld, 'new row should be tinted right after close')
        await page.waitForTimeout(2600)
        const bgAfter = await page.getByTestId('row-0').evaluate((el) => getComputedStyle(el).backgroundColor)
        assert.equal(bgAfter, bgOld, 'glow should fade out')
        await page.screenshot({ path: `${out}/${theme}-glow-2750ms.png` })
      }
      await page.close()
    }
  }

  // Auto-close: result card disappears on its own.
  {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
    await page.goto(`${base}?view=overlay&scenario=win&theme=dark`)
    await page.getByTestId('run').click()
    await page.getByRole('button', { name: 'Done' }).waitFor()
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 })
    console.log('auto-close: ok')
    await page.close()
  }

  // Reduced motion: no checklist, result shows immediately.
  {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' })
    await page.goto(`${base}?view=overlay&scenario=win&theme=dark`)
    await page.getByTestId('run').click()
    await page.getByRole('button', { name: 'Done' }).waitFor({ timeout: 300 })
    assert.match(await page.getByText(/trades imported/).innerText(), /^47 trades imported$/)
    console.log('reduced motion: result shown immediately with final count')
    await page.close()
  }

  // Mobile width
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 740 }, deviceScaleFactor: 2 })
    await page.goto(`${base}?view=overlay&scenario=win&theme=dark`)
    await page.getByTestId('run').click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${out}/mobile-steps.png` })
    await page.getByRole('button', { name: 'Done' }).waitFor()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${out}/mobile-result.png` })
    await page.close()
  }

  // Hero stagger: sample each block's opacity over time.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
    await page.goto(`${base}?view=hero&theme=dark`)
    const sel = { headline: 'h1', subtitle: 'p.text-muted-foreground', avatars: 'text=traders journaling', buttons: 'text=View Live Demo' }
    const firstVisible = {}
    const start = Date.now()
    while (Date.now() - start < 2200) {
      const t = Date.now() - start
      for (const [k, s] of Object.entries(sel)) {
        if (firstVisible[k] !== undefined) continue
        const op = await page.locator(s).first().evaluate((el) => {
          let n = el, o = 1
          while (n) { o *= Number(getComputedStyle(n).opacity); n = n.parentElement }
          return o
        }).catch(() => 0)
        if (op > 0.5) firstVisible[k] = t
      }
      await page.waitForTimeout(20)
    }
    console.log('hero: ms until each block is >50% visible', firstVisible)
    const order = ['headline', 'subtitle', 'avatars', 'buttons'].map((k) => firstVisible[k])
    for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `hero block ${i} should appear after block ${i - 1}`)
    await page.screenshot({ path: `${out}/hero-final.png` })
    await page.close()
  }

  assert.deepEqual(errors, [], 'page errors')
  console.log(`PASS — frames in ${out}`)
} finally {
  await browser.close()
  await server.close()
}
