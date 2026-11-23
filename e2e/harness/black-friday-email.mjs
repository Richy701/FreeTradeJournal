// Renders the Black Friday 2026 email to HTML and screenshots it so the copy
// and layout can be checked before anything is sent. No sending.
// Usage: node e2e/harness/black-friday-email.mjs <outDir>
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = path.resolve(process.argv[2] || '')
if (!process.argv[2]) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

// The renderer must live inside functions/ so its requires resolve there.
const renderer = `
  const React = require('react');
  const { render } = require('@react-email/components');
  const { BlackFridayEmail } = require('../src/emails/BlackFridayEmail');
  (async () => {
    for (const [variant, file] of [['announce', 'black-friday.html'], ['reminder', 'black-friday-reminder.html'], ['final', 'black-friday-final.html']]) {
      const html = await render(React.createElement(BlackFridayEmail, { firstName: 'Richy', unsubscribeUrl: 'https://example.com/unsubscribe', variant }));
      require('fs').writeFileSync(require('path').join(process.argv[2], file), html);
    }
  })();
`
const renderPath = path.join(root, 'functions/scripts/.black-friday-render.tmp.ts')
fs.writeFileSync(renderPath, renderer)
try {
  execSync(
    `npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' ${renderPath} ${outDir}`,
    { cwd: path.join(root, 'functions'), stdio: 'inherit' },
  )
} finally {
  fs.rmSync(renderPath, { force: true })
}

const browser = await chromium.launch()
for (const [variant, file] of [['announce', 'black-friday.html'], ['reminder', 'black-friday-reminder.html'], ['final', 'black-friday-final.html']]) {
  for (const [label, width] of [['desktop', 700], ['phone', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto('file://' + path.join(outDir, file))
    await page.waitForTimeout(500)
    const name = variant === 'announce' ? `email-${label}.png` : `email-${variant}-${label}.png`
    await page.screenshot({ path: path.join(outDir, name), fullPage: true })
    console.log('captured', variant, label)
    await page.close()
  }
}
await browser.close()
