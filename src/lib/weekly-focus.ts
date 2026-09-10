export const WEEKLY_FOCUS_KEY = 'coachingFocus';
export type CheckInStatus = 'followed' | 'missed' | 'no_trading';
type Base = { id: string; accountId: string; createdAt: string };
export type FocusPlan = Base & { kind: 'plan'; habit: string; startDate: string };
export type FocusCheckIn = Base & { kind: 'checkin'; planId: string; date: string; status: CheckInStatus };
export type FocusReview = Base & { kind: 'review'; planId: string; reflection: string; endedEarly?: boolean; endDate?: string };
export type FocusRecord = FocusPlan | FocusCheckIn | FocusReview;

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar arithmetic (not 24-hour durations), so a DST change keeps seven days.
export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return localDay(new Date(year, month - 1, date + amount, 12));
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;
}

/** Reject malformed storage instead of overwriting history with an empty list. */
export function readFocusRecords(raw: string | null): FocusRecord[] {
  if (!raw) return [];
  const records: unknown = JSON.parse(raw);
  if (!Array.isArray(records) || records.some(record => {
    if (!record || typeof record !== 'object') return true;
    if (typeof record.id !== 'string' || !record.id || typeof record.accountId !== 'string' || !record.accountId ||
        typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))) return true;
    if (record.kind === 'plan') return typeof record.habit !== 'string' || !record.habit.trim() || record.habit.length > 240 || !validDay(record.startDate);
    if (typeof record.planId !== 'string' || !record.planId) return true;
    if (record.kind === 'checkin') return !validDay(record.date) || !['followed', 'missed', 'no_trading'].includes(record.status);
    if (record.kind === 'review') return typeof record.reflection !== 'string' || !record.reflection.trim() || record.reflection.length > 1000 || (record.endedEarly !== undefined && typeof record.endedEarly !== 'boolean') || (record.endDate !== undefined && !validDay(record.endDate));
    return true;
  })) throw new Error('Your saved weekly focus could not be read. Your existing data has been kept.');
  return records as FocusRecord[];
}

export function plansForAccount(records: FocusRecord[], accountId: string): FocusPlan[] {
  return records.filter((record): record is FocusPlan => record.kind === 'plan' && record.accountId === accountId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id));
}

export function summarizeFocus(records: FocusRecord[], plan: FocusPlan, today: string) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(plan.startDate, index));
  const ordered = records.filter(record => record.accountId === plan.accountId && record.kind !== 'plan' && record.planId === plan.id)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
  const checks = new Map<string, CheckInStatus>();
  let review: FocusReview | null = null;
  for (const record of ordered) {
    if (record.kind === 'checkin' && days.includes(record.date) && record.date <= today) checks.set(record.date, record.status);
    if (record.kind === 'review') review = record;
  }
  const cutoff = review?.endedEarly ? (review.endDate ?? localDay(new Date(review.createdAt))) : today;
  for (const day of checks.keys()) if (day > cutoff) checks.delete(day);
  const values = [...checks.values()];
  const followed = values.filter(value => value === 'followed').length;
  const missed = values.filter(value => value === 'missed').length;
  const noTrading = values.filter(value => value === 'no_trading').length;
  const due = today >= addDays(plan.startDate, 7);
  return { days, checks, review, followed, missed, noTrading, due,
    recorded: checks.size, scored: followed + missed,
    unrecorded: days.filter(day => day <= today && day <= cutoff && !checks.has(day)).length };
}

// Append-only records allow the existing collection sync to preserve check-ins
// from different devices by id. Corrections append a newer record for that day.
export function appendFocusRecord(records: FocusRecord[], next: FocusRecord, today: string): FocusRecord[] {
  readFocusRecords(JSON.stringify([next]));
  if (records.some(record => record.id === next.id)) return records;
  if (next.kind === 'plan') {
    const previous = plansForAccount(records, next.accountId)[0];
    if (next.startDate !== today) throw new Error('A new focus starts today.');
    if (previous && !summarizeFocus(records, previous, today).review) throw new Error('Finish reviewing your current focus before starting another.');
  } else {
    const plan = plansForAccount(records, next.accountId).find(plan => plan.id === next.planId);
    if (!plan) throw new Error('This focus is no longer available in this account.');
    const summary = summarizeFocus(records, plan, today);
    if (summary.review) throw new Error('This focus has already been reviewed.');
    if (next.kind === 'checkin' && (!summary.days.includes(next.date) || next.date > today)) throw new Error('Choose a day in this focus that has already started.');
    if (next.kind === 'review' && !summary.due && !next.endedEarly) throw new Error('Your review opens after seven days.');
    if (next.kind === 'review' && next.endDate !== undefined && next.endDate !== today) throw new Error('Your review must use today’s date.');
  }
  return [...records, next];
}
