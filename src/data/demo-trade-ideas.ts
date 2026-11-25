import type { CommunityIdea, IdeaProfile } from '@/types/trade-ideas'
import { DEMO_TRADES } from '@/data/demo-data'

export const DEMO_IDEA_UID = 'demo-user'
export const DEMO_IDEA_PROFILE: IdeaProfile = {
  handle: 'alexmorgan', avatarEmoji: null, avatarColor: '#3b82f6', role: null,
  ideaCount: 3, winCount: 2, lossCount: 1, breakevenCount: 0,
}
export const DEMO_LIKED_IDEA_IDS: string[] = []
const reflections = [
  'Example setup: waiting for the session open, entry only after the retest, stop and target set before the trade. The linked trade shows how it played out.',
  'Example setup: one planned entry with fixed risk. Check the linked result and remember that one trade does not prove an edge.',
  'Example setup: a pullback entry with the exit decided beforehand. A short note after the trade helps separate a good decision from a lucky result.',
]
export const DEMO_TRADE_IDEAS: CommunityIdea[] = DEMO_TRADES.slice(0, 3).map((trade, i) => ({
  id: `demo-idea-${i + 1}`, authorUid: DEMO_IDEA_UID, handle: DEMO_IDEA_PROFILE.handle,
  avatarEmoji: null, avatarColor: DEMO_IDEA_PROFILE.avatarColor, authorRole: null,
  kind: 'idea', title: null, symbol: trade.symbol, market: 'forex', direction: trade.side,
  entry: trade.entryPrice, stop: trade.stopLoss ?? null, target: trade.takeProfit ?? null,
  reasoning: reflections[i], imageUrl: null, imageSource: null, status: 'published', likeCount: 0,
  outcome: { result: trade.pnl > 0 ? 'win' : 'loss', pnl: trade.pnl, currency: 'USD',
    closedAt: new Date(trade.exitTime ?? trade.date).toISOString(), tradeId: trade.id },
  createdAt: new Date(new Date(trade.entryTime ?? trade.date).getTime() - 10 * 60000),
}))
