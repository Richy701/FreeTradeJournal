/**
 * Push the 7 Resend-hosted onboarding templates from their React sources.
 * These are the templates used by the Resend automations ("Onboarding:
 * Activation Sequence" + "Onboarding: Conversion Drip"), not sent from index.ts.
 *
 * Personalisation: Resend templates only render {{{TRIPLE_BRACE}}} variables
 * that are DECLARED on the template. Anything else (Liquid-style
 * `{{contact.firstName | default: x}}`) publishes fine and then fails every
 * send with "Template rendering failed". So the name is a declared variable
 * with a fallback, and each automation send step maps it:
 *   "variables": { "NAME": { "var": "contact.first_name" } }
 *
 * Usage (run from functions/ directory):
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/push-resend-templates.ts [--dry]
 *
 * --dry renders and validates only (writes HTML to the given OUT_DIR or ./tmp-templates).
 */

import * as React from 'react'
import { render } from '@react-email/components'
import * as path from 'path'
import * as fs from 'fs'
import { ActivationAiGradeEmail } from '../src/emails/ActivationAiGradeEmail'
import { ActivationImportEmail } from '../src/emails/ActivationImportEmail'
import { ActivationProofEmail } from '../src/emails/ActivationProofEmail'
import { Day3NudgeEmail } from '../src/emails/Day3NudgeEmail'
import { Day7NudgeEmail } from '../src/emails/Day7NudgeEmail'
import { Day14UpgradeEmail } from '../src/emails/Day14UpgradeEmail'
import { Day21BackupEmail } from '../src/emails/Day21BackupEmail'

// ── Load functions/.env for local runs (only fills unset vars) ─
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

export const NAME_VARIABLE = 'NAME'
export const NAME_FALLBACK = 'Trader'
const NAME_PLACEHOLDER = '__FIRSTNAME__'
const NAME_TAG = `{{{${NAME_VARIABLE}}}}`
const UNSUBSCRIBE_TAG = '{{{RESEND_UNSUBSCRIBE_URL}}}'
const ALLOWED_TAGS = new Set([NAME_TAG, UNSUBSCRIBE_TAG])

type Props = { firstName: string; unsubscribeUrl?: string }
const TEMPLATES: { alias: string; component: (props: Props) => React.ReactElement }[] = [
  { alias: 'activation-ai-grade', component: ActivationAiGradeEmail },
  { alias: 'day-3-nudge', component: Day3NudgeEmail },
  { alias: 'activation-import', component: ActivationImportEmail },
  { alias: 'activation-proof', component: ActivationProofEmail },
  { alias: 'day-7-nudge', component: Day7NudgeEmail },
  { alias: 'day-14-upgrade', component: Day14UpgradeEmail },
  { alias: 'day-21-backup', component: Day21BackupEmail },
]

function assertOnlyAllowedTags(alias: string, kind: string, content: string) {
  // Any brace run that isn't exactly one of the allowed triple-brace tags
  // would break rendering at send time, so refuse to push it.
  const found = content.match(/\{\{+[^{}]*\}+\}/g) || []
  const bad = found.filter((tag) => !ALLOWED_TAGS.has(tag))
  if (bad.length) throw new Error(`${alias} ${kind}: unsupported template tag(s): ${[...new Set(bad)].join(', ')}`)
  if (!content.includes(NAME_TAG)) throw new Error(`${alias} ${kind}: name tag missing`)
  if (!content.includes(UNSUBSCRIBE_TAG)) throw new Error(`${alias} ${kind}: unsubscribe tag missing`)
  if (content.includes(NAME_PLACEHOLDER)) throw new Error(`${alias} ${kind}: placeholder left in output`)
}

async function renderTemplate(t: (typeof TEMPLATES)[number]) {
  const element = React.createElement(t.component, { firstName: NAME_PLACEHOLDER, unsubscribeUrl: UNSUBSCRIBE_TAG })
  const swap = (s: string) => s.split(NAME_PLACEHOLDER).join(NAME_TAG)
  const html = swap(await render(element))
  const text = swap(await render(element, { plainText: true }))
  assertOnlyAllowedTags(t.alias, 'html', html)
  assertOnlyAllowedTags(t.alias, 'text', text)
  return { html, text }
}

async function api(method: string, route: string, body?: unknown) {
  const res = await fetch(`https://api.resend.com${route}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${JSON.stringify(json)}`)
  return json
}

async function main() {
  const dry = process.argv.includes('--dry')
  if (!dry && !process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing (functions/.env)')
  const outDir = process.env.OUT_DIR || path.resolve(__dirname, '../tmp-templates')

  for (const t of TEMPLATES) {
    const { html, text } = await renderTemplate(t)
    if (dry) {
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, `${t.alias}.html`), html)
      fs.writeFileSync(path.join(outDir, `${t.alias}.txt`), text)
      console.log(`rendered ${t.alias} (${html.length} chars)`)
      continue
    }
    await api('PATCH', `/templates/${t.alias}`, {
      html,
      text,
      variables: [{ key: NAME_VARIABLE, type: 'string', fallback_value: NAME_FALLBACK }],
    })
    await api('POST', `/templates/${t.alias}/publish`)
    console.log(`pushed + published ${t.alias}`)
    await new Promise((r) => setTimeout(r, 600)) // Resend rate limit is 2 req/s
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
