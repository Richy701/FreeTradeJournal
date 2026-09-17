/**
 * One-off cleanup: until Sep 17 2026, onUserCreated saved the user's whole
 * email address as the Resend contact's first name when there was no display
 * name (every email/password signup). The hosted onboarding templates greet
 * people by contact.first_name, so those contacts would read
 * "bob@gmail.com, review your next trade." This blanks any first name that
 * contains "@" so the template fallback is used instead. Idempotent.
 *
 * Usage (run from functions/ directory):
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/clean-resend-contact-names.ts [--dry]
 */

import * as path from 'path'
import * as fs from 'fs'

// ── Load functions/.env for local runs (only fills unset vars) ─
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function api(method: string, route: string, body?: unknown): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.resend.com${route}`, {
      method,
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 429) { await sleep(2000); continue }
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${JSON.stringify(json)}`)
    return json
  }
  throw new Error(`${method} ${route} → rate limited 5 times`)
}

async function main() {
  const dry = process.argv.includes('--dry')
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing (functions/.env)')

  const junk: { id: string; email: string; first_name: string }[] = []
  let after: string | undefined
  for (;;) {
    const page = await api('GET', `/contacts?limit=100${after ? `&after=${after}` : ''}`)
    const rows: any[] = page.data || []
    for (const c of rows) if ((c.first_name || '').includes('@')) junk.push({ id: c.id, email: c.email, first_name: c.first_name })
    if (!page.has_more || !rows.length) break
    after = rows[rows.length - 1].id
    await sleep(600)
  }
  console.log(`${junk.length} contacts have an email address as their first name`)
  if (dry) return

  let done = 0
  for (const c of junk) {
    await api('PATCH', `/contacts/${c.id}`, { first_name: '' })
    done++
    if (done % 50 === 0) console.log(`  blanked ${done}/${junk.length}`)
    await sleep(600) // Resend rate limit is 2 req/s
  }
  console.log(`done: blanked ${done}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
