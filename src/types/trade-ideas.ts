// Community trade ideas (the /trade-ideas feed). Mirrors the document shape
// written by functions/src/trade-ideas.ts.

export const IDEA_MARKETS = ['forex', 'futures', 'indices', 'stocks', 'crypto', 'other'] as const
export type IdeaMarket = (typeof IDEA_MARKETS)[number]
export type IdeaDirection = 'long' | 'short'
export type IdeaResult = 'win' | 'loss' | 'breakeven'
export type IdeaStatus = 'published' | 'hidden'
/** "dev" marks the FreeTradeJournal team on the feed and unlocks moderation. */
export type IdeaRole = 'dev' | null
/** Ideas carry levels and an outcome; posts are plain team updates from dev accounts. */
export type IdeaKind = 'idea' | 'post'

export const IDEA_MARKET_LABELS: Record<IdeaMarket, string> = {
  forex: 'Forex',
  futures: 'Futures',
  indices: 'Indices',
  stocks: 'Stocks',
  crypto: 'Crypto',
  other: 'Other',
}

export const IDEA_REPORT_REASONS = [
  { value: 'spam', label: 'Spam or promotion' },
  { value: 'abuse', label: 'Abusive or offensive' },
  { value: 'misleading', label: 'Misleading or fake result' },
  { value: 'other', label: 'Something else' },
] as const
export type IdeaReportReason = (typeof IDEA_REPORT_REASONS)[number]['value']

export interface IdeaOutcome {
  result: IdeaResult
  pnl: number
  currency: string
  closedAt: string
  tradeId: string
}

export interface CommunityIdea {
  id: string
  authorUid: string
  handle: string
  avatarEmoji: string | null
  avatarColor: string
  authorRole: IdeaRole
  kind: IdeaKind
  /** Team updates only. */
  title: string | null
  symbol: string
  market: IdeaMarket
  direction: IdeaDirection
  entry: number
  stop: number | null
  target: number | null
  /** The idea's reasoning, or the body of a team update. */
  reasoning: string
  imageUrl: string | null
  /** Where the image came from: an upload or a GIPHY GIF (shown as attribution). */
  imageSource: 'upload' | 'giphy' | null
  status: IdeaStatus
  likeCount: number
  outcome: IdeaOutcome | null
  createdAt: Date
}

export interface IdeaProfile {
  handle: string
  avatarEmoji: string | null
  avatarColor: string
  role: IdeaRole
  ideaCount: number
  winCount: number
  lossCount: number
  breakevenCount: number
}

/** Moderation state for the signed-in user only (users/{uid}/meta/ideaModeration). */
export interface IdeaModeration {
  hiddenCount: number
  reportedCount: number
  postingBlocked: boolean
}

export interface IdeaAvatar {
  avatarEmoji: string | null
  avatarColor: string
}

export interface NewIdeaInput {
  symbol: string
  market: IdeaMarket
  direction: IdeaDirection
  entry: number
  stop: number
  target: number | null
  reasoning: string
  image: string | null
  gifUrl: string | null
}

/** Planned reward-to-risk from the posted levels, or null if either is missing. */
export function plannedRewardRatio(idea: Pick<CommunityIdea, 'entry' | 'stop' | 'target'>): number | null {
  if (idea.stop === null || idea.target === null) return null
  const risk = Math.abs(idea.entry - idea.stop)
  const reward = Math.abs(idea.target - idea.entry)
  if (risk <= 0) return null
  return reward / risk
}

/** Hit rate over ideas with a linked outcome (breakeven excluded from the numerator). */
export function profileHitRate(profile: IdeaProfile): { rate: number; decided: number } | null {
  const decided = profile.winCount + profile.lossCount + profile.breakevenCount
  if (decided === 0) return null
  return { rate: profile.winCount / decided, decided }
}

export interface NewTeamUpdateInput {
  title: string
  body: string
  image: string | null
  gifUrl: string | null
}
