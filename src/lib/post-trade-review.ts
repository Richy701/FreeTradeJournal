export const PLAN_ANSWERS = { yes: 'Followed my plan', partly: 'Partly followed my plan', no: 'Did not follow my plan', none: 'Had no plan' } as const;
export type PlanAnswer = keyof typeof PLAN_ANSWERS;
export type ReviewTrade = { id: string; symbol: string; accountId?: string; strategy?: string; emotions?: string };
export type ReviewEntry = {
  id: string; title: string; content: string; accountId?: string;
  tradeId?: string; tradeIds?: string[];
  quickReview?: { tradeId: string; plan: PlanAnswer };
  lesson?: string;
  lessonPinned?: boolean;
  [key: string]: unknown;
};

export function readReviewEntries(raw: string | null): ReviewEntry[] {
  if (!raw) return [];
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.some(entry => !entry || typeof entry.id !== 'string' || typeof entry.content !== 'string')) {
    throw new Error('Your journal could not be loaded. Please reload before saving a review.');
  }
  return entries;
}

export function findTradeReview(entries: ReviewEntry[], trade: ReviewTrade) {
  return entries.find(entry => entry.quickReview?.tradeId === trade.id && entry.accountId === trade.accountId);
}

export type ReviewLesson = { emotion: string; lesson: string; carryForward: boolean };

export function saveTradeReview(entries: ReviewEntry[], trade: ReviewTrade, plan: PlanAnswer, content: string, now: string, lesson?: ReviewLesson): { entries: ReviewEntry[]; entry: ReviewEntry } {
  if (!(plan in PLAN_ANSWERS) || !content.trim() || content.length > 5000) throw new Error('Choose a plan answer and write a reflection of up to 5,000 characters.');
  if (lesson && (lesson.lesson.length > 300 || (lesson.carryForward && !lesson.lesson.trim()))) throw new Error('Write a lesson of up to 300 characters to carry forward.');
  const existing = findTradeReview(entries, trade);
  const entry: ReviewEntry = existing ? {
    ...existing, content: content.trim(), quickReview: { tradeId: trade.id, plan }, updatedAt: now,
  } : {
    id: crypto.randomUUID(), title: `${trade.symbol} · Post-trade review`, content: content.trim(),
    date: now, createdAt: now, updatedAt: now, tags: trade.strategy ? [trade.strategy] : [],
    emotions: trade.emotions?.split(',').map(value => value.trim()).filter(Boolean) ?? [],
    mood: 'neutral', entryType: 'post-trade', accountId: trade.accountId,
    tradeId: trade.id, tradeIds: [trade.id], quickReview: { tradeId: trade.id, plan },
  };
  if (lesson) {
    entry.lesson = lesson.lesson.trim();
    entry.lessonPinned = lesson.carryForward;
    entry.emotions = lesson.emotion ? [lesson.emotion] : [];
  }
  const remaining = entries.map(item => {
    if (item.id === existing?.id) return entry;
    return lesson?.carryForward && item.accountId === trade.accountId && item.lessonPinned
      ? { ...item, lessonPinned: false }
      : item;
  });
  return { entry, entries: existing ? remaining : [entry, ...remaining] };
}
