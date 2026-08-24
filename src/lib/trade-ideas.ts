// Client access for the community Trade Ideas feed.
//
// Reads go straight to Firestore (rules expose published ideas, profiles and
// handles to signed-in users). Every write is a callable in
// functions/src/trade-ideas.ts. Demo mode has no Firebase user, so reads fall
// back to the fixtures in src/data/demo-trade-ideas.ts and writes are stopped
// by useDemoGuard before they get here.

import { getFirebaseFirestore, getFirebaseFunctions } from '@/lib/firebase-lazy'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import type {
  CommunityIdea,
  IdeaAvatar,
  IdeaModeration,
  IdeaOutcome,
  IdeaProfile,
  IdeaReportReason,
  IdeaRole,
  IdeaStatus,
  NewIdeaInput,
  NewTeamUpdateInput,
} from '@/types/trade-ideas'
import { DEFAULT_AVATAR_COLOR } from '@/constants/avatars'

export const IDEA_PAGE_SIZE = 20

export type IdeaFeedPage = {
  ideas: CommunityIdea[]
  cursor: QueryDocumentSnapshot<DocumentData> | null
  done: boolean
}

function isDemo(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.dataset.demo
}

async function callable<Req, Res>(name: string) {
  const [functions, { httpsCallable }] = await Promise.all([
    getFirebaseFunctions(),
    import('firebase/functions'),
  ])
  return httpsCallable<Req, Res>(functions, name)
}

/** Firebase callable errors carry a `code` like "functions/resource-exhausted" and a server message. */
export function callableMessage(err: unknown, fallback: string): string {
  const e = err as { code?: string; message?: string } | undefined
  if (e?.message && e.code && e.code.startsWith('functions/') && e.code !== 'functions/internal') return e.message
  return fallback
}

export function callableCode(err: unknown): string | null {
  const e = err as { code?: string } | undefined
  return typeof e?.code === 'string' ? e.code.replace(/^functions\//, '') : null
}

function toIdea(snap: QueryDocumentSnapshot<DocumentData>): CommunityIdea {
  const d = snap.data()
  const created = d.createdAt?.toDate?.() as Date | undefined
  const outcome = d.outcome
    ? ({
        result: d.outcome.result,
        pnl: Number(d.outcome.pnl) || 0,
        currency: d.outcome.currency || 'USD',
        closedAt: d.outcome.closedAt || '',
        tradeId: d.outcome.tradeId || '',
      } satisfies IdeaOutcome)
    : null
  return {
    id: snap.id,
    authorUid: d.authorUid,
    handle: d.handle,
    avatarEmoji: typeof d.avatarEmoji === 'string' ? d.avatarEmoji : null,
    avatarColor: typeof d.avatarColor === 'string' ? d.avatarColor : DEFAULT_AVATAR_COLOR,
    authorRole: d.authorRole === 'dev' ? 'dev' : null,
    kind: d.kind === 'post' ? 'post' : 'idea',
    title: typeof d.title === 'string' && d.title ? d.title : null,
    symbol: typeof d.symbol === 'string' ? d.symbol : '',
    market: d.market ?? 'other',
    direction: d.direction === 'short' ? 'short' : 'long',
    entry: Number(d.entry) || 0,
    stop: d.stop === null || d.stop === undefined ? null : Number(d.stop),
    target: d.target === null || d.target === undefined ? null : Number(d.target),
    reasoning: d.reasoning || '',
    imageUrl: d.imageUrl || null,
    imageSource: d.imageSource === 'giphy' ? 'giphy' : d.imageUrl ? 'upload' : null,
    status: d.status,
    likeCount: Number(d.likeCount) || 0,
    outcome,
    createdAt: created ?? new Date(),
  }
}

// ─── Reads ───────────────────────────────────────────────────

export async function fetchIdeaFeed(
  scope: { kind: 'latest' } | { kind: 'mine'; uid: string },
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<IdeaFeedPage> {
  if (isDemo()) {
    const { DEMO_TRADE_IDEAS, DEMO_IDEA_UID } = await import('@/data/demo-trade-ideas')
    const ideas = scope.kind === 'mine' ? DEMO_TRADE_IDEAS.filter(i => i.authorUid === DEMO_IDEA_UID) : DEMO_TRADE_IDEAS
    return { ideas, cursor: null, done: true }
  }

  const [db, fs] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const { collection, query, where, orderBy, limit, startAfter, getDocs } = fs
  const constraints = [
    scope.kind === 'mine' ? where('authorUid', '==', scope.uid) : where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(IDEA_PAGE_SIZE),
  ]
  const snap = await getDocs(query(collection(db, 'tradeIdeas'), ...constraints))
  const ideas = snap.docs.map(toIdea)
  const last = snap.docs[snap.docs.length - 1] ?? null
  return { ideas, cursor: last, done: snap.docs.length < IDEA_PAGE_SIZE }
}

export async function fetchIdeaProfile(uid: string): Promise<IdeaProfile | null> {
  if (isDemo()) {
    const { DEMO_IDEA_PROFILE } = await import('@/data/demo-trade-ideas')
    return DEMO_IDEA_PROFILE
  }
  const [db, { doc, getDoc }] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const snap = await getDoc(doc(db, 'profiles', uid))
  const d = snap.data()
  if (!d?.handle) return null
  return {
    handle: d.handle,
    avatarEmoji: typeof d.avatarEmoji === 'string' ? d.avatarEmoji : null,
    avatarColor: typeof d.avatarColor === 'string' ? d.avatarColor : DEFAULT_AVATAR_COLOR,
    role: d.role === 'dev' ? 'dev' : null,
    ideaCount: Number(d.ideaCount) || 0,
    winCount: Number(d.winCount) || 0,
    lossCount: Number(d.lossCount) || 0,
    breakevenCount: Number(d.breakevenCount) || 0,
  }
}

/** The viewer's own moderation counters; null when nothing has been recorded. */
export async function fetchIdeaModeration(uid: string): Promise<IdeaModeration | null> {
  if (isDemo()) return null
  const [db, { doc, getDoc }] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const snap = await getDoc(doc(db, 'users', uid, 'meta', 'ideaModeration'))
  const d = snap.data()
  if (!d) return null
  return {
    hiddenCount: Number(d.hiddenCount) || 0,
    reportedCount: Number(d.reportedCount) || 0,
    postingBlocked: !!d.postingBlocked,
  }
}

/** Mirrors the server thresholds in functions/src/trade-ideas.ts. */
export function isPostingBlocked(m: IdeaModeration | null): boolean {
  return !!m && (m.postingBlocked || m.hiddenCount >= 3 || m.reportedCount >= 10)
}

export async function fetchLikedIdeaIds(uid: string): Promise<Set<string>> {
  if (isDemo()) {
    const { DEMO_LIKED_IDEA_IDS } = await import('@/data/demo-trade-ideas')
    return new Set(DEMO_LIKED_IDEA_IDS)
  }
  const [db, { doc, getDoc }] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const snap = await getDoc(doc(db, 'users', uid, 'meta', 'ideaLikes'))
  const ids = snap.data()?.ids
  return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [])
}

/** True when nobody holds this handle yet. Case-insensitive. */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const [db, { doc, getDoc }] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const snap = await getDoc(doc(db, 'handles', handle.trim().replace(/^@/, '').toLowerCase()))
  return !snap.exists()
}

// ─── Writes (Cloud Functions) ────────────────────────────────

export async function claimHandle(handle: string, avatar: IdeaAvatar): Promise<{ handle: string; role: IdeaRole } & IdeaAvatar> {
  const fn = await callable<{ handle: string } & IdeaAvatar, { handle: string; role?: IdeaRole } & IdeaAvatar>('claimHandle')
  const res = await fn({ handle, ...avatar })
  return { ...res.data, role: res.data.role === 'dev' ? 'dev' : null }
}

/** Dev accounts only: hide or unhide any idea. */
export async function moderateTradeIdea(ideaId: string, action: 'hide' | 'unhide'): Promise<IdeaStatus> {
  const fn = await callable<{ ideaId: string; action: 'hide' | 'unhide' }, { status: IdeaStatus }>('moderateTradeIdea')
  const res = await fn({ ideaId, action })
  return res.data.status
}

export async function updateIdeaAvatar(avatar: IdeaAvatar): Promise<IdeaAvatar> {
  const fn = await callable<IdeaAvatar, IdeaAvatar>('updateIdeaAvatar')
  const res = await fn(avatar)
  return res.data
}

/** Dev accounts only: a plain team update on the feed. */
export async function postTeamUpdate(input: NewTeamUpdateInput): Promise<string> {
  const fn = await callable<NewTeamUpdateInput, { id: string }>('postTeamUpdate')
  const res = await fn(input)
  return res.data.id
}

export async function postTradeIdea(input: NewIdeaInput): Promise<string> {
  const fn = await callable<NewIdeaInput, { id: string }>('postTradeIdea')
  const res = await fn(input)
  return res.data.id
}

export async function setIdeaOutcome(ideaId: string, outcome: IdeaOutcome | null): Promise<void> {
  const fn = await callable<{ ideaId: string; outcome: IdeaOutcome | null }, { outcome: IdeaOutcome | null }>('setIdeaOutcome')
  await fn({ ideaId, outcome })
}

export async function toggleIdeaLike(ideaId: string): Promise<{ liked: boolean; likeCount: number }> {
  const fn = await callable<{ ideaId: string }, { liked: boolean; likeCount: number }>('toggleIdeaLike')
  const res = await fn({ ideaId })
  return res.data
}

export async function reportTradeIdea(ideaId: string, reason: IdeaReportReason, note: string): Promise<{ hidden: boolean; alreadyReported: boolean }> {
  const fn = await callable<{ ideaId: string; reason: IdeaReportReason; note: string }, { hidden: boolean; alreadyReported: boolean }>('reportTradeIdea')
  const res = await fn({ ideaId, reason, note })
  return res.data
}

export async function deleteTradeIdea(ideaId: string): Promise<void> {
  const fn = await callable<{ ideaId: string }, { ok: boolean }>('deleteTradeIdea')
  await fn({ ideaId })
}

/**
 * How many published ideas were posted after `since`, capped at `cap + 1` so
 * the sidebar can show "9+" without reading the whole feed. Demo has no feed
 * history to compare against, so it always reports none.
 */
export async function fetchNewIdeaCount(since: Date, cap = 9): Promise<number> {
  if (isDemo()) return 0
  const [db, fs] = await Promise.all([getFirebaseFirestore(), import('firebase/firestore')])
  const { collection, query, where, orderBy, limit, getDocs, Timestamp } = fs
  const snap = await getDocs(query(
    collection(db, 'tradeIdeas'),
    where('status', '==', 'published'),
    where('createdAt', '>', Timestamp.fromDate(since)),
    orderBy('createdAt', 'desc'),
    limit(cap + 1),
  ))
  return snap.size
}
