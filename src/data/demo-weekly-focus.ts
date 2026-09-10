import { addDays, localDay, type CheckInStatus, type FocusRecord } from '@/lib/weekly-focus';

/** Build dates when the demo starts, so the current week always has days left. */
export function createDemoWeeklyFocus(accountId: string, today = localDay()): FocusRecord[] {
  const currentStart = addDays(today, -4);
  const previousStart = addDays(currentStart, -7);
  const timestamp = (day: string, hour: number) => new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).toISOString();
  const records: FocusRecord[] = [];

  function addPlan(id: string, startDate: string, habit: string, checks: CheckInStatus[]) {
    records.push({ kind: 'plan', id, accountId, startDate, habit, createdAt: timestamp(startDate, 8) });
    checks.forEach((status, index) => {
      const date = addDays(startDate, index);
      records.push({ kind: 'checkin', id: `${id}-day-${index}`, accountId, planId: id, date, status, createdAt: timestamp(date, 18) });
    });
  }

  addPlan('demo-focus-previous', previousStart, 'Write down my entry reason before placing a trade.', [
    'followed', 'followed', 'missed', 'no_trading', 'followed', 'followed', 'no_trading',
  ]);
  records.push({
    kind: 'review', id: 'demo-focus-previous-review', accountId, planId: 'demo-focus-previous',
    createdAt: timestamp(currentStart, 7), endDate: currentStart,
    reflection: 'Writing down the setup helped me wait for a clear entry. I rushed one trade after a loss. This week I will focus on pausing before taking another trade.',
  });
  addPlan('demo-focus-current', currentStart, 'Take a five-minute break after a losing trade before considering another entry.', [
    'followed', 'missed', 'no_trading', 'followed',
  ]);
  return records;
}
