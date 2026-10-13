/**
 * Default: read-only provider diff + local backup. Never sends an event/email.
 * Run from repo root with node --env-file=functions/.env and ts-node.
 * --apply --guard-deployed explicitly acknowledges that the new onUserCreated
 * gate and all fallback functions were deployed and verified first.
 */
import * as admin from 'firebase-admin'
import { createHash, randomUUID } from 'crypto'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { activationWorkflow, ONBOARDING_SUBJECTS } from '../src/onboarding-emails'
import { ENROLLMENT_GATE } from '../src/enrollment-gate'
import { TEMPLATES, renderTemplate, NAME_VARIABLE, NAME_FALLBACK } from './push-resend-templates'
import { runActivationRollout } from './rollout-support/activation-rollout'

const AUTOMATION_ID = '019ebca6-f87a-739f-95d7-8053fe33fbc9'
type Graph = ReturnType<typeof activationWorkflow>
type Automation = Graph & { id: string; name: string; status: string }
type Template = { id: string; alias: string; status: string; html: string; text: string; subject: string; variables: unknown[]; has_unpublished_versions: boolean }
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const stable = (value: unknown): string => JSON.stringify(value, (_key, item) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item)
const graph = (value: Graph): Graph => ({ steps: value.steps, connections: value.connections })
const digest = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex')

async function api<T>(method: 'GET' | 'PATCH' | 'POST', route: string, body?: unknown): Promise<T> {
  await sleep(600) // Space every request, including PATCH -> publish.
  const response = await fetch(`https://api.resend.com${route}`, {
    method, headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`${method} ${route}: HTTP ${response.status}`)
  return response.json() as Promise<T>
}

async function main() {
  const args = process.argv.slice(2)
  const allowed = new Set(['--dry', '--apply', '--guard-deployed'])
  if (args.some(arg => !allowed.has(arg)) || (args.includes('--dry') && args.includes('--apply'))) throw new Error('Use --dry, or --apply --guard-deployed')
  const apply = args.includes('--apply')
  if (apply && !args.includes('--guard-deployed')) throw new Error('Deploy and verify the enrollment gate and fallback functions first; then use --apply --guard-deployed')
  if (!process.env.RESEND_API_KEY) throw new Error('Load functions/.env before running')
  const before = await api<Automation>('GET', `/automations/${AUTOMATION_ID}`)
  if (before.id !== AUTOMATION_ID || before.name !== 'Onboarding: Activation Sequence' || before.status !== 'enabled') throw new Error('Unexpected automation identity/status; stop for review')
  const templates: { before: Template; after: { html: string; text: string; subject: string } }[] = []
  for (const template of TEMPLATES) {
    const current = await api<Template>('GET', `/templates/${template.alias}`)
    if (current.alias !== template.alias || current.status !== 'published' || current.has_unpublished_versions || !current.html || !current.text) throw new Error(`Unexpected template state or unpublished draft: ${template.alias}`)
    const subject = template.alias === 'day-3-nudge' ? ONBOARDING_SUBJECTS.entry
      : template.alias === 'day-7-nudge' ? ONBOARDING_SUBJECTS.support : current.subject
    templates.push({ before: current, after: { ...await renderTemplate(template), subject } })
  }
  const templateId = (alias: string) => templates.find(item => item.before.alias === alias)!.before.id
  const after = activationWorkflow(templateId('day-3-nudge'), templateId('day-7-nudge'))
  for (const [key, subject] of [['entry', ONBOARDING_SUBJECTS.entry], ['support', ONBOARDING_SUBJECTS.support]]) {
    const step = after.steps.find(item => item.key === key)
    if (!step || !('subject' in step.config) || step.config.subject !== subject) throw new Error(`Subject mismatch: ${key}`)
  }
  const fingerprint = digest({ before, templates, after })
  const out = resolve(process.env.ROLLOUT_DIR || '/tmp/ftj-activation-rollout')
  mkdirSync(out, { recursive: true, mode: 0o700 })
  if (!apply) {
    writeFileSync(`${out}/plan.json`, JSON.stringify({ fingerprint, before, after, templates }, null, 2), { mode: 0o600 })
    console.log(JSON.stringify({ mode: 'READ ONLY', fingerprint, automation: before.name,
      currentSubjects: before.steps.filter(item => item.type === 'send_email').map(item => item.config),
      proposedSubjects: [ONBOARDING_SUBJECTS.entry, ONBOARDING_SUBJECTS.support],
      templates: templates.map(item => ({ alias: item.before.alias, changed: item.before.html !== item.after.html || item.before.text !== item.after.text })),
      backup: `${out}/plan.json`, gates: ['Inbox appearance approved', 'Functions deployed by name, including enrollment gate', 'Reviewed this exact plan'],
    }, null, 2))
    return
  }
  const approved = JSON.parse(readFileSync(`${out}/plan.json`, 'utf8')) as { fingerprint: string }
  if (approved.fingerprint !== fingerprint) throw new Error('Provider or local content changed since dry run. Generate and review a fresh plan.')
  admin.initializeApp({ projectId: 'tradevault-41c68' })
  const db = admin.firestore()
  const gate = db.doc(ENROLLMENT_GATE)
  const owner = randomUUID()
  const verifyGraph = async (expected: Graph) => {
    const actual = await api<Automation>('GET', `/automations/${AUTOMATION_ID}`)
    if (actual.status !== 'enabled' || stable(graph(actual)) !== stable(graph(expected))) throw new Error('Enabled workflow does not match expected graph/subjects')
  }
  const publish = async (template: Template, content: { html: string; text: string; subject: string; variables: unknown[] }) => {
    await api('PATCH', `/templates/${template.id}`, content)
    await api('POST', `/templates/${template.id}/publish`)
    const actual = await api<Template>('GET', `/templates/${template.id}`)
    if (actual.status !== 'published' || actual.html !== content.html || actual.text !== content.text || actual.subject !== content.subject) throw new Error(`Published content mismatch: ${template.alias}`)
  }
  await runActivationRollout({
    closeGate: () => db.runTransaction(async tx => {
      const state = (await tx.get(gate)).data()
      if (state?.paused) throw new Error('Enrollment gate already paused; inspect the existing rollout before continuing')
      tx.set(gate, { paused: true, owner, startedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    }),
    drainGate: async () => {
      const deadline = Date.now() + 120000
      while (Date.now() < deadline) {
        const state = (await gate.get()).data()
        if (state?.owner !== owner || !state.paused) throw new Error('Enrollment gate ownership changed')
        if (!Object.keys(state.handoffs || {}).length) {
          if (digest(await api<Automation>('GET', `/automations/${AUTOMATION_ID}`)) !== digest(before)) throw new Error('Automation changed while draining; refusing to overwrite')
          for (const template of templates) {
            if (digest(await api<Template>('GET', `/templates/${template.before.id}`)) !== digest(template.before)) throw new Error(`Template changed while draining: ${template.before.alias}`)
          }
          return
        }
        await sleep(1000)
      }
      throw new Error('Signup handoffs did not drain. No provider changes attempted; inspect stale claims.')
    },
    publishTemplates: async () => {
      for (const template of templates) await publish(template.before, { ...template.after, variables: [{ key: NAME_VARIABLE, type: 'string', fallback_value: NAME_FALLBACK }] })
    },
    disable: async () => { await api('PATCH', `/automations/${AUTOMATION_ID}`, { status: 'disabled' }) },
    replaceGraph: async () => { await api('PATCH', `/automations/${AUTOMATION_ID}`, after) },
    enable: async () => { await api('PATCH', `/automations/${AUTOMATION_ID}`, { status: 'enabled' }) },
    verify: () => verifyGraph(after),
    restore: async () => {
      await api('PATCH', `/automations/${AUTOMATION_ID}`, { status: 'disabled' })
      await api('PATCH', `/automations/${AUTOMATION_ID}`, graph(before))
      for (const template of templates) await publish(template.before, {
        html: template.before.html, text: template.before.text, subject: template.before.subject, variables: template.before.variables,
      })
      await api('PATCH', `/automations/${AUTOMATION_ID}`, { status: 'enabled' })
      await verifyGraph(before)
    },
    openGate: () => db.runTransaction(async tx => {
      const state = (await tx.get(gate)).data()
      if (state?.owner !== owner) throw new Error('Enrollment gate ownership changed; refusing to reopen it')
      tx.update(gate, { paused: false, owner: admin.firestore.FieldValue.delete() })
    }),
  })
  console.log('Templates and activation workflow verified; enrollment gate reopened. No events replayed. Existing runs/templates retained.')
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
