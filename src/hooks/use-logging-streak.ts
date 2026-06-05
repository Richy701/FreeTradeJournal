import { useMemo } from 'react';
import { useDemoData } from '@/hooks/use-demo-data';

export function useLoggingStreak() {
  const { getTrades } = useDemoData();

  return useMemo(() => {
    const trades = getTrades();
    if (!trades || trades.length === 0) return { streak: 0, loggedToday: false };

    const tradeDates = new Set<string>();
    for (const t of trades) {
      const d = new Date(t.exitTime || t.entryTime);
      if (!isNaN(d.getTime())) {
        tradeDates.add(toDateKey(d));
      }
    }

    const today = new Date();
    const todayKey = toDateKey(today);
    const loggedToday = tradeDates.has(todayKey);

    let streak = 0;
    const start = new Date(today);

    // If they haven't logged today, start counting from yesterday
    if (!loggedToday) {
      start.setDate(start.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const key = toDateKey(start);
      if (tradeDates.has(key)) {
        streak++;
        start.setDate(start.getDate() - 1);
      } else {
        break;
      }
    }

    return { streak, loggedToday };
  }, [getTrades]);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
