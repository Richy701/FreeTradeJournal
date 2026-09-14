import { createHash } from 'crypto'
import { BASE_URL } from './emails/facts'

export interface ReleaseItem {
  type: 'new' | 'improved' | 'fixed'
  text: string
  description?: string
  highlight?: boolean
  roundup?: boolean
  image?: { src: string; alt: string }
  link?: { to: string; label: string }
}
export interface ReleaseEntry { version: string; date: string; summary: string; items: ReleaseItem[] }
export interface RoundupFeature extends ReleaseItem { id: string; version: string; date: string }
export interface RoundupContent { month: string; subject: string; preview: string; features: RoundupFeature[] }
export const UNSUBSCRIBE_MARKER = '__FTJ_ROUNDUP_UNSUBSCRIBE__'

export function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
export function previousMonth(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)
}
export function monthLabel(month: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Use a month in YYYY-MM format')
  return new Date(month + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
export function publicUrl(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) throw new Error('Feature links must use site-relative URLs')
  const url = new URL(value, BASE_URL)
  if (url.origin !== BASE_URL) throw new Error('Unexpected feature URL')
  return url.href
}
export function roundupCandidates(entries: ReleaseEntry[], month: string): RoundupFeature[] {
  monthLabel(month)
  const seen = new Set<string>()
  return entries.filter(entry => /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && entry.date.startsWith(month + '-'))
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap(entry => entry.items.map((item, i) => ({ ...item, id: `${entry.version}/${i}`, version: entry.version, date: entry.date })))
    .filter(item => {
      if (item.roundup === false || (item.type === 'fixed' && item.roundup !== true)) return false
      const key = item.text.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      if (item.image) publicUrl(item.image.src)
      if (item.link) publicUrl(item.link.to)
      return true
    })
}
export function makeRoundup(month: string, candidates: RoundupFeature[], selected?: string[]): RoundupContent {
  const features = selected ? selected.map(id => {
    const feature = candidates.find(item => item.id === id)
    if (!feature) throw new Error('A selected feature is not in this draft')
    return feature
  }) : [...candidates].sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight)).slice(0, 4)
  if (features.length > 6 || new Set(features.map(item => item.id)).size !== features.length) throw new Error('Choose up to six different features')
  return { month, subject: `${monthLabel(month)}: what’s new in FreeTradeJournal`, preview: features.slice(0, 2).map(item => item.text).join('. '), features }
}
export function eligibleRecipient(user: { email?: string; emailVerified: boolean; disabled: boolean }, data: Record<string, unknown> | undefined): boolean {
  return !!user.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) && user.emailVerified && !user.disabled && !!data && !data.emailOptOut && !data.signupThrottled && !data.isTestAccount
}
export function approvalMatches(draft: { status: string; revision: string; recipientCount: number; preparedAt: number }, revision: string, count: number, now: number): boolean {
  return draft.status === 'draft' && draft.revision === revision && draft.recipientCount === count && count > 0 && now - draft.preparedAt >= 0 && now - draft.preparedAt < 24 * 60 * 60 * 1000
}
