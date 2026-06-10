import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 5199

const server = await createServer({
  root: __dirname,
  configFile: false,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '../../src') } },
  server: { port: PORT },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch()
const page = await browser.newPage()
page.setDefaultTimeout(5000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

try {
  await page.goto(`http://localhost:${PORT}/`)

  // Open the modal dialog (mirrors opening the edit-trade dialog)
  await page.getByTestId('open-dialog').click()

  // Open the instrument combobox
  await page.getByRole('combobox').click()

  // Real mouse click into the search box, then real keystrokes to whatever holds
  // focus — this is the faithful test. If the Dialog steals focus, keys are lost.
  const input = page.getByPlaceholder('Search or type custom symbol...')
  const active1 = await page.evaluate(() => {
    const a = document.activeElement
    return a ? `${a.tagName}[${a.getAttribute('placeholder') || a.getAttribute('role') || ''}]` : 'none'
  })
  await input.click()
  const active2 = await page.evaluate(() => {
    const a = document.activeElement
    return a ? `${a.tagName}[${a.getAttribute('placeholder') || a.getAttribute('role') || ''}]` : 'none'
  })
  await page.keyboard.type('MNQ', { delay: 30 })
  const active3 = await page.evaluate(() => {
    const a = document.activeElement
    return a ? `${a.tagName}[${a.getAttribute('placeholder') || a.getAttribute('role') || ''}]` : 'none'
  })
  console.log('activeElement on open:', active1, '| after input.click:', active2, '| after typing:', active3)

  const typed = await input.inputValue().catch(() => '')
  // After filtering to "MNQ", the non-matching "ES" option must be gone.
  const esStillVisible = await page
    .getByText('ES - E-mini S&P 500')
    .isVisible()
    .catch(() => false)

  let current = '(not selected)'
  const mnqOption = page.getByText('MNQ - Micro E-mini Nasdaq')
  if (await mnqOption.isVisible().catch(() => false)) {
    await mnqOption.click()
    current = (await page.getByTestId('current-value').textContent()) ?? ''
  }

  console.log('search input value after typing:', JSON.stringify(typed))
  console.log('non-matching "ES" still visible (should be false):', esStillVisible)
  console.log('selected value after picking MNQ:', current)
  if (errors.length) console.log('page errors:', errors)

  const pass = typed === 'MNQ' && esStillVisible === false && current === 'MNQ'
  console.log(pass ? 'PASS: search + select works' : 'FAIL: cannot type/search in combobox')
  await browser.close()
  await server.close()
  process.exit(pass ? 0 : 1)
} catch (e) {
  console.error('harness error:', e.message)
  if (errors.length) console.log('page errors:', errors)
  await browser.close()
  await server.close()
  process.exit(2)
}
