import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { getFirebaseFunctions } from '@/lib/firebase-lazy'
import { httpsCallable } from 'firebase/functions'

type Feature = { id: string; text: string; version: string; date: string; image?: { src: string; alt: string } }
type Summary = { month: string; status: string; recipientCount: number; sent?: number; skipped?: number; failed?: number }
export interface RoundupDraft extends Summary {
  candidates?: Feature[]
  content?: { subject: string; preview: string; features: Feature[] }
  html?: string
  revision?: string
  preparedAt?: number
  sourceVersion?: string
  error?: string
}
const previousMonth = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)
}
async function call<T>(input: Record<string, unknown>): Promise<T> {
  const fn = httpsCallable<Record<string, unknown>, T>(await getFirebaseFunctions(), 'manageMonthlyRoundup')
  return (await fn(input)).data
}

export function RoundupReview({ draft, busy, onSelect, onRefresh, onApprove }: {
  draft: RoundupDraft; busy: boolean; onSelect: (ids: string[]) => void; onRefresh: () => void; onApprove: () => void
}) {
  const [ids, setIds] = useState(draft.content?.features.map(feature => feature.id) ?? [])
  const [confirm, setConfirm] = useState(false)
  const [width, setWidth] = useState('640')
  const changed = JSON.stringify(ids) !== JSON.stringify(draft.content?.features.map(feature => feature.id) ?? [])
  const expired = !draft.preparedAt || Date.now() - draft.preparedAt >= 86_400_000
  const editable = draft.status === 'draft'
  return <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Eligible recipients</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums">{draft.recipientCount.toLocaleString()}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Verified accounts, including Free and Pro. Opt-outs, disabled accounts, throttled signups and marked test accounts are excluded. Eligibility is checked again before sending.</p>
        {editable && <Button className="mt-4 w-full" variant="outline" disabled={busy} onClick={onRefresh}>Refresh draft & audience</Button>}
        <p className="mt-3 text-xs text-muted-foreground">{draft.preparedAt ? `Prepared ${new Date(draft.preparedAt).toLocaleString()}` : 'Not prepared'}</p>
        {editable && expired && <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">Refresh this draft before approval. Audience reviews expire after 24 hours.</p>}
      </section>
      {editable && <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Choose up to six updates</h2>
        <p className="mt-2 text-sm text-muted-foreground">Check that each feature is still available. Refreshing restores the suggested selection.</p>
        <div className="mt-4 max-h-[480px] space-y-4 overflow-auto">
          {draft.candidates?.map(feature => <label className="flex cursor-pointer items-start gap-3 text-sm" key={feature.id}>
            <input className="mt-1 size-4 accent-amber-500" type="checkbox" checked={ids.includes(feature.id)} disabled={busy || (!ids.includes(feature.id) && ids.length >= 6)} onChange={event => { setConfirm(false); setIds(event.target.checked ? [...ids, feature.id] : ids.filter(id => id !== feature.id)) }} />
            <span>{feature.text}<span className="mt-1 block text-xs text-muted-foreground">{feature.date} · v{feature.version}{feature.image ? ' · Screenshot' : ''}</span></span>
          </label>)}
        </div>
        <Button variant="outline" className="mt-5 w-full" disabled={busy || !changed || ids.length === 0} onClick={() => onSelect(ids)}>Update preview</Button>
      </section>}
      {(draft.status === 'approved' || draft.status === 'sending' || draft.status.startsWith('completed') || draft.status === 'sent' || draft.status === 'needs-review') && <section className="rounded-xl border bg-card p-5 text-sm leading-7">
        <h2 className="font-semibold">Send progress</h2>
        <p>{draft.sent ?? 0} accepted by provider</p><p>{draft.skipped ?? 0} skipped</p><p>{draft.failed ?? 0} failed</p>
        <p className="mt-2 text-muted-foreground">Failed or expired sends require review; they are not automatically restarted.</p>
      </section>}
    </aside>
    <section className="min-w-0 space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subject</p>
        <h2 className="mt-2 text-xl font-semibold">{draft.content?.subject}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{draft.content?.preview}</p>
        <p className="mt-4 text-xs text-muted-foreground">Source: deployed changelog v{draft.sourceVersion}. Preview links do not send email.</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm">Preview width <select className="ml-2 rounded-md border bg-background px-3 py-2" value={width} onChange={event => setWidth(event.target.value)}><option value="375">Mobile</option><option value="640">Desktop</option></select></label>
        <span className="text-sm text-muted-foreground">{draft.content?.features.length ?? 0} updates</span>
      </div>
      <div className="flex justify-center overflow-hidden rounded-xl border bg-zinc-100 p-2 sm:p-4">
        <iframe title="Monthly roundup email preview" sandbox="" className="h-[1100px] max-w-full border-0 bg-white" style={{ width: Number(width) }} srcDoc={draft.html?.replaceAll('__FTJ_ROUNDUP_UNSUBSCRIBE__', '#unsubscribe')} />
      </div>
      {editable && <div className="rounded-xl border border-amber-500/40 bg-card p-5">
        <h2 className="font-semibold">Your approval is required</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Approve only after reviewing the email above. It will be queued for these {draft.recipientCount.toLocaleString()} recipients. New accounts will not be added after approval; later opt-outs will be skipped.</p>
        {confirm ? <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={busy || changed || expired || draft.recipientCount === 0} onClick={onApprove}>Approve & send to {draft.recipientCount.toLocaleString()}</Button>
          <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>Keep as draft</Button>
        </div> : <Button className="mt-4" disabled={busy || changed || expired || draft.recipientCount === 0} onClick={() => setConfirm(true)}>Review send approval</Button>}
        {changed && <p className="mt-3 text-sm">Update the preview before approving.</p>}
      </div>}
    </section>
  </div>
}

export default function EmailRoundups() {
  const { user } = useAuth()
  const allowed = user?.emailVerified && user.email?.toLowerCase() === 'richmondlamptey75@gmail.com'
  const [month, setMonth] = useState(previousMonth)
  const [list, setList] = useState<Summary[]>([])
  const [draft, setDraft] = useState<RoundupDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const [summaries, current] = await Promise.all([call<Summary[]>({ action: 'list' }), call<RoundupDraft | null>({ action: 'get', month })])
    setList(summaries); setDraft(current)
  }, [month])
  useEffect(() => {
    if (!allowed) return
    let active = true
    setBusy(true); setError(''); setDraft(null)
    Promise.all([call<Summary[]>({ action: 'list' }), call<RoundupDraft | null>({ action: 'get', month })]).then(([summaries, current]) => { if (active) { setList(summaries); setDraft(current) } }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'Could not load roundups.') }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [allowed, month])
  async function run(action: string, extra = {}) {
    setBusy(true); setError('')
    try { await call({ action, month, ...extra }); await load() } catch (error) { setError(error instanceof Error ? error.message : 'The request failed. Reload before trying again.') } finally { setBusy(false) }
  }
  if (!allowed) return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-semibold">Admin access required</h1><p className="mt-3">Sign in with the verified owner account to review email roundups.</p><Link className="mt-5 inline-block underline" to="/dashboard">Back to journal</Link></main>
  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-8">
    <Link to="/dashboard" className="text-sm text-muted-foreground underline">Back to journal</Link>
    <header className="my-8 flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email review</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Monthly feature roundup</h1><p className="mt-3 text-sm text-muted-foreground">Prepared on the 1st at 09:00 London time. Sent only after your approval.</p></div>
      <label className="text-sm">Month <input aria-label="Roundup month" type="month" max={previousMonth()} value={month} disabled={busy} onChange={event => { if (event.target.value) setMonth(event.target.value) }} className="ml-2 rounded-md border bg-background px-3 py-2" /></label>
    </header>
    {error && <p role="alert" className="mb-6 rounded-lg border border-red-400 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    <p role="status" aria-live="polite" className="mb-5 text-sm text-muted-foreground">{busy ? 'Working…' : draft ? `Status: ${draft.status}` : 'No draft for this month.'}</p>
    {draft?.html && draft.content && !['preparing', 'error', 'empty'].includes(draft.status) ? <RoundupReview key={draft.revision} draft={draft} busy={busy} onSelect={ids => void run('select', { ids, revision: draft.revision })} onRefresh={() => void run('prepare')} onApprove={() => void run('approve', { revision: draft.revision, recipientCount: draft.recipientCount })} /> : <section className="rounded-xl border bg-card p-8"><h2 className="text-xl font-semibold">{draft?.status === 'empty' ? 'No eligible updates this month' : 'Prepare a review draft'}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{draft?.error || 'Preparation reads the deployed changelog and counts eligible recipients. It does not send an email.'}</p><Button className="mt-5" disabled={busy || draft?.status === 'preparing'} onClick={() => void run('prepare')}>Prepare draft</Button></section>}
    <section className="mt-10 border-t pt-6"><h2 className="font-semibold">Recent roundups</h2><div className="mt-3 flex flex-wrap gap-3">{list.map(item => <Button key={item.month} variant="outline" disabled={busy} onClick={() => setMonth(item.month)}>{item.month} · {item.status}</Button>)}<Button variant="ghost" disabled={busy} onClick={() => void run('get')}>Refresh status</Button></div></section>
  </main>
}
