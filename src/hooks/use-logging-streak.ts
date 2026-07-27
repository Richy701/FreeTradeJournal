import { useMemo, useEffect } from 'react';
import { useDemoData } from '@/hooks/use-demo-data';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

const MILESTONES = [7, 30, 100, 365];

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// True when every day strictly between a and b falls on a weekend
function gapIsOnlyWeekends(a: Date, b: Date): boolean {
  const cursor = new Date(a);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < b) {
    if (!isWeekend(cursor)) return false;
    cursor.setDate(cursor.getDate() + 1);
  }
  return true;
}

// Streak of days with a trade or journal entry logged. Weekends never break
// it (markets are closed), so a Mon-Fri logger can build long streaks; a
// weekend day WITH activity still counts toward it.
export function useLoggingStreak() {
  const { getTrades, getJournalEntries, isDemo } = useDemoData();
  const { user } = useAuth();

  const result = useMemo(() => {
    const days = new Set<string>();
    for (const t of getTrades() ?? []) {
      const d = new Date(t.exitTime || t.entryTime);
      if (!isNaN(d.getTime())) days.add(toDateKey(d));
    }
    for (const e of getJournalEntries() ?? []) {
      const d = new Date(e.date || e.createdAt);
      if (!isNaN(d.getTime())) days.add(toDateKey(d));
    }
    if (days.size === 0) return { streak: 0, bestStreak: 0, loggedToday: false };

    const today = new Date();
    const loggedToday = days.has(toDateKey(today));

    // Current streak: walk back from today. A logged day counts; today (not
    // logged yet) and weekends are skipped without breaking; a bare weekday
    // ends the streak.
    let streak = 0;
    const cursor = new Date(today);
    for (let i = 0; i < 730; i++) {
      if (days.has(toDateKey(cursor))) streak++;
      else if (i !== 0 && !isWeekend(cursor)) break;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Best streak ever: runs of logged days where gaps span only weekends
    const sorted = [...days].sort();
    let bestStreak = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const key of sorted) {
      const day = fromDateKey(key);
      run = prev && gapIsOnlyWeekends(prev, day) ? run + 1 : 1;
      if (run > bestStreak) bestStreak = run;
      prev = day;
    }
    if (streak > bestStreak) bestStreak = streak;

    return { streak, bestStreak, loggedToday };
  }, [getTrades, getJournalEntries]);

  // Celebrate milestones once per crossing; a broken streak re-arms them
  useEffect(() => {
    if (!user || isDemo) return;
    const key = `ftj-streak-milestone-${user.uid}`;
    const reached = MILESTONES.filter((m) => m <= result.streak).pop() ?? 0;
    const celebrated = Number(localStorage.getItem(key) || 0);
    if (reached > celebrated) {
      toast.success(`${reached}-day logging streak`, {
        description: 'Every trading day journaled. Keep it going.',
      });
    }
    if (reached !== celebrated) localStorage.setItem(key, String(reached));
  }, [result.streak, user, isDemo]);

  return result;
}
