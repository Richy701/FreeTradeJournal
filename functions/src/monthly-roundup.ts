import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { randomUUID } from 'crypto'
import { render } from '@react-email/components'
import * as React from 'react'
import type { Resend } from 'resend'
import { MonthlyRoundupEmail } from './emails/MonthlyRoundupEmail'
import { BASE_URL } from './emails/facts'
import { approvalMatches, digest, eligibleRecipient, makeRoundup, monthLabel, previousMonth, publicUrl, roundupCandidates, UNSUBSCRIBE_MARKER } from './monthly-roundup-data'
import type { RoundupContent, RoundupFeature, ReleaseEntry } from './monthly-roundup-data'

type Recipient = { uid: string; email: string }
interface Draft {
  month: string; status: string; candidates: RoundupFeature[]; content: RoundupContent
  html: string; text: string; revision: string; audienceId: string; recipientCount: number
  preparedAt: number; approvedAt?: number; approvedRevision?: string; sourceVersion: string; sourceBuiltAt: string
  sent?: number; skipped?: number; failed?: number; leaseUntil?: number; leaseOwner?: string
}
interface Dependencies {
  db: FirebaseFirestore.Firestore
  assertAdmin: (context: functions.https.CallableContext) => void
  send: Resend['emails']['send']
  unsubscribeUrl: (uid: string) => string
  from: string
}

export function createMonthlyRoundupFunctions(deps: Dependencies) {
  const { db } = deps
  const drafts = db.collection('monthlyEmailRoundups')
  const auth = admin.auth()
  const ownerEmails = new Set(['richmondlamptey75@gmail.com', 'richyturnitup@gmail.com', 'richmondolletey@gmail.com'])
  const stamp = () => admin.firestore.FieldValue.serverTimestamp()

  async function renderContent(content: RoundupContent) {
    const element = React.createElement(MonthlyRoundupEmail, { content, unsubscribeUrl: UNSUBSCRIBE_MARKER })
    const html = await render(element)
    const text = await render(element, { plainText: true })
    if (Buffer.byteLength(html) > 90_000) throw new Error('The email is too long. Select fewer features.')
    return { html, text }
  }
  async function recipients(): Promise<Recipient[]> {
    const docs = await db.collection('users').select('emailOptOut', 'signupThrottled', 'isTestAccount').get()
    const state = new Map(docs.docs.map(doc => [doc.id, doc.data()]))
    const result: Recipient[] = []
    const seen = new Set<string>()
    let pageToken: string | undefined
    do {
      const page = await auth.listUsers(1000, pageToken)
      for (const user of page.users) {
        const email = user.email?.trim().toLowerCase()
        if (!eligibleRecipient(user, state.get(user.uid)) || !email || ownerEmails.has(email) || seen.has(email)) continue
        seen.add(email)
        result.push({ uid: user.uid, email })
      }
      pageToken = page.pageToken
    } while (pageToken)
    return result.sort((a, b) => a.uid.localeCompare(b.uid))
  }
  async function prepare(month: string, automatic = false) {
    monthLabel(month)
    if (month > previousMonth()) throw new functions.https.HttpsError('invalid-argument', 'Choose a completed month.')
    const ref = drafts.doc(month)
    const audienceId = randomUUID()
    const locked = await db.runTransaction(async tx => {
      const snap = await tx.get(ref)
      const old = snap.data() as Draft | undefined
      if (automatic && old) return false
      if (old && !['draft', 'empty', 'error', 'preparing'].includes(old.status)) throw new functions.https.HttpsError('failed-precondition', 'This roundup has already been approved or sent.')
      if (old?.status === 'preparing' && Date.now() - old.preparedAt < 600_000) throw new functions.https.HttpsError('failed-precondition', 'Preparation is already running.')
      tx.set(ref, { month, status: 'preparing', audienceId, preparedAt: Date.now(), updatedAt: stamp() }, { merge: true })
      return true
    })
    if (!locked) return
    try {
      const response = await fetch(`${BASE_URL}/email-releases.json`, { signal: AbortSignal.timeout(30_000), cache: 'no-store' })
      if (!response.ok) throw new Error('The deployed changelog feed is unavailable. Deploy the website first.')
      const feed = await response.json() as { entries: ReleaseEntry[]; version: string; builtAt: string }
      if (!Array.isArray(feed.entries) || !feed.version || !Number.isFinite(Date.parse(feed.builtAt))) throw new Error('Invalid deployed changelog feed.')
      const candidates = roundupCandidates(feed.entries, month)
      const content = makeRoundup(month, candidates)
      for (const feature of content.features) {
        if (feature.image) {
          const image = await fetch(publicUrl(feature.image.src), { method: 'HEAD', signal: AbortSignal.timeout(15_000) })
          if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) throw new Error('A selected screenshot is unavailable: ' + feature.image.src)
        }
      }
      const audience = content.features.length ? await recipients() : []
      const collection = ref.collection('audiences').doc(audienceId).collection('recipients')
      for (let offset = 0; offset < audience.length; offset += 400) {
        const batch = db.batch()
        for (const recipient of audience.slice(offset, offset + 400)) batch.create(collection.doc(recipient.uid), { ...recipient, status: 'pending' })
        await batch.commit()
      }
      const rendered = await renderContent(content)
      const revision = digest({ ...rendered, audienceId, audience })
      await db.runTransaction(async tx => {
        const current = await tx.get(ref)
        if (current.data()?.audienceId !== audienceId) throw new Error('A newer preparation replaced this request.')
        tx.set(ref, { month, candidates, content, ...rendered, revision, audienceId, recipientCount: audience.length, preparedAt: Date.now(), sourceVersion: feed.version, sourceBuiltAt: feed.builtAt, status: content.features.length ? 'draft' : 'empty', sent: 0, skipped: 0, failed: 0, updatedAt: stamp() })
      })
    } catch (error) {
      await db.runTransaction(async tx => {
        const current = await tx.get(ref)
        if (current.data()?.audienceId === audienceId) tx.update(ref, { status: 'error', error: error instanceof Error ? error.message : 'Preparation failed', updatedAt: stamp() })
      })
      throw error
    }
  }

  const manageMonthlyRoundup = functions.runWith({ timeoutSeconds: 300, memory: '512MB' }).https.onCall(async (input, context) => {
    deps.assertAdmin(context)
    const action = input?.action
    if (action === 'list') {
      const snap = await drafts.orderBy('month', 'desc').limit(18).select('month', 'status', 'recipientCount', 'sent', 'skipped', 'failed').get()
      return snap.docs.map(doc => {
        const d = doc.data()
        return { month: doc.id, status: d.status, recipientCount: d.recipientCount ?? 0, sent: d.sent ?? 0, skipped: d.skipped ?? 0, failed: d.failed ?? 0 }
      })
    }
    const month = input?.month || previousMonth()
    try { monthLabel(month) } catch { throw new functions.https.HttpsError('invalid-argument', 'Use YYYY-MM.') }
    const ref = drafts.doc(month)
    if (action === 'prepare') {
      await prepare(month)
    } else if (action === 'select') {
      if (!Array.isArray(input.ids) || !input.ids.every((id: unknown) => typeof id === 'string')) throw new functions.https.HttpsError('invalid-argument', 'Choose features from this draft.')
      const snap = await ref.get()
      const draft = snap.data() as Draft | undefined
      if (!draft || draft.status !== 'draft' || draft.revision !== input.revision) throw new functions.https.HttpsError('failed-precondition', 'The draft changed. Reload before editing.')
      const content = makeRoundup(month, draft.candidates, input.ids)
      if (!content.features.length) throw new functions.https.HttpsError('invalid-argument', 'Choose at least one feature.')
      for (const feature of content.features) {
        if (feature.image) {
          const response = await fetch(publicUrl(feature.image.src), { method: 'HEAD', signal: AbortSignal.timeout(15_000) })
          if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new functions.https.HttpsError('failed-precondition', 'A selected screenshot is unavailable.')
        }
      }
      const rendered = await renderContent(content)
      await db.runTransaction(async tx => {
        const current = await tx.get(ref)
        if (current.data()?.status !== 'draft' || current.data()?.revision !== input.revision) throw new functions.https.HttpsError('failed-precondition', 'The draft changed. Reload before editing.')
        tx.update(ref, { content, ...rendered, revision: digest({ ...rendered, audienceId: draft.audienceId, previous: draft.revision }), updatedAt: stamp() })
      })
    } else if (action === 'approve') {
      await db.runTransaction(async tx => {
        const snap = await tx.get(ref)
        const draft = snap.data() as Draft | undefined
        if (!draft || !approvalMatches(draft, input.revision, input.recipientCount, Date.now())) throw new functions.https.HttpsError('failed-precondition', 'The draft changed or is over 24 hours old. Refresh and review it again.')
        tx.update(ref, { status: 'approved', approvedAt: Date.now(), approvedRevision: draft.revision, approvedBy: context.auth!.uid, updatedAt: stamp() })
      })
    } else if (action !== 'get') {
      throw new functions.https.HttpsError('invalid-argument', 'Unknown roundup action.')
    }
    const snap = await ref.get()
    return snap.exists ? { ...snap.data(), month } : null
  })

  const prepareMonthlyRoundup = functions.runWith({ timeoutSeconds: 300, memory: '512MB' })
    .pubsub.schedule('0 9 1 * *').timeZone('Europe/London').onRun(async () => { await prepare(previousMonth(), true) })

  const sendApprovedRoundups = functions.runWith({ timeoutSeconds: 300, memory: '512MB', maxInstances: 1 })
    .pubsub.schedule('every 1 minutes').onRun(async () => {
      const jobs = await drafts.where('status', 'in', ['approved', 'sending']).limit(1).get()
      if (jobs.empty) return
      const ref = jobs.docs[0].ref
      const owner = randomUUID()
      const draft = await db.runTransaction(async tx => {
        const snap = await tx.get(ref)
        const d = snap.data() as Draft
        if (!['approved', 'sending'].includes(d.status) || !d.approvedAt || (d.leaseUntil ?? 0) > Date.now()) return null
        if (d.approvedRevision !== d.revision) {
          tx.update(ref, { status: 'needs-review', updatedAt: stamp() })
          return null
        }
        // Do not retry uncertain deliveries beyond the provider idempotency window.
        if (Date.now() - d.approvedAt > 23 * 60 * 60 * 1000) {
          tx.update(ref, { status: 'needs-review', updatedAt: stamp() })
          return null
        }
        tx.update(ref, { status: 'sending', leaseOwner: owner, leaseUntil: Date.now() + 600_000 })
        return d
      })
      if (!draft) return
      const pending = ref.collection('audiences').doc(draft.audienceId).collection('recipients')
      try {
        const batch = await pending.where('status', '==', 'pending').limit(100).get()
        const started = Date.now()
        for (const item of batch.docs) {
          if (Date.now() - started > 210_000) break
          const recipient = item.data() as Recipient
          try {
            const user = await auth.getUser(recipient.uid).catch((error: { code?: string }) => {
              if (error.code === 'auth/user-not-found') return null
              throw error
            })
            const state = await db.collection('users').doc(recipient.uid).get()
            if (!user || !eligibleRecipient(user, state.data()) || user.email?.trim().toLowerCase() !== recipient.email) {
              await item.ref.update({ status: 'skipped', finishedAt: stamp() })
              continue
            }
            const unsubscribe = deps.unsubscribeUrl(recipient.uid)
            await deps.send({
              from: deps.from, to: recipient.email, subject: draft.content.subject,
              html: draft.html.replaceAll(UNSUBSCRIBE_MARKER, unsubscribe.replaceAll('&', '&amp;')),
              text: draft.text.replaceAll(UNSUBSCRIBE_MARKER, unsubscribe),
              headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
            }, { idempotencyKey: `monthly-roundup/${draft.month}/${recipient.uid}` })
            await item.ref.update({ status: 'sent', finishedAt: stamp() })
          } catch (error) {
            await item.ref.update({ status: 'failed', failureReason: error instanceof Error ? error.message.slice(0, 500) : 'Delivery failed', finishedAt: stamp() })
          }
          await new Promise(resolve => setTimeout(resolve, 550))
        }
        const counts = await Promise.all(['pending', 'sent', 'skipped', 'failed'].map(status => pending.where('status', '==', status).count().get()))
        await ref.update({ status: counts[0].data().count ? 'sending' : counts[3].data().count ? 'completed-with-errors' : 'sent', sent: counts[1].data().count, skipped: counts[2].data().count, failed: counts[3].data().count, updatedAt: stamp() })
      } finally {
        await db.runTransaction(async tx => {
          const latest = await tx.get(ref)
          if (latest.data()?.leaseOwner === owner) tx.update(ref, { leaseUntil: 0, leaseOwner: '', updatedAt: stamp() })
        })
      }
    })
  return { manageMonthlyRoundup, prepareMonthlyRoundup, sendApprovedRoundups }
}
