// Renders the three lifetime-drop emails to HTML and screenshots them so the
// copy and layout can be checked before anything is armed. No sending.
// Usage: node e2e/harness/lifetime-drop-emails.mjs <outDir>
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

// Render via ts-node inside functions/ so the templates' imports resolve.
const renderer = `
  const React = require('react');
  const { render } = require('@react-email/components');
  const { LifetimeDropTeaserEmail } = require('./src/emails/LifetimeDropTeaserEmail');
  const { LifetimeDropEmail } = require('./src/emails/LifetimeDropEmail');
  const { LifetimeDropClosingEmail } = require('./src/emails/LifetimeDropClosingEmail');
  (async () => {
    const out = process.argv[2];
    const props = { firstName: 'Richy', unsubscribeUrl: 'https://example.com/unsubscribe' };
    for (const [name, C] of [['teaser', LifetimeDropTeaserEmail], ['drop', LifetimeDropEmail], ['closing', LifetimeDropClosingEmail]]) {
      const html = await render(React.createElement(C, props));
      require('fs').writeFileSync(require('path').join(out, name + '.html'), html);
    }
  })();
`
// The renderer must live inside functions/ so its requires resolve there.
const renderPath = path.join(root, 'functions/scripts/.lifetime-drop-render.tmp.ts')
fs.writeFileSync(renderPath, renderer.replace(/\.\/src\//g, '../src/'))
try {
  execSync(
    `npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' ${renderPath} ${outDir}`,
    { cwd: path.join(root, 'functions'), stdio: 'inherit' },
  )
} finally {
  fs.rmSync(renderPath, { force: true })
}

const browser = await chromium.launch()
for (const name of ['teaser', 'drop', 'closing']) {
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } })
  await page.goto('file://' + path.join(outDir, name + '.html'))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outDir, `email-${name}.png`), fullPage: true })
  console.log('captured', name)
  await page.close()
}
await browser.close()
