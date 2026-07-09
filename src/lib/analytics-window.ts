// Free-plan analytics window: dashboard stats/charts for non-Pro users are
// computed over the trailing FREE_ANALYTICS_WINDOW_DAYS only. Pure so it can
// be unit-tested; the React side lives in use-demo-data's getAnalyticsTrades.

export interface WindowedTrades {
  trades: any[];
  hiddenCount: number;
}

export function windowAnalyticsTrades(
  trades: any[],
  days: number,
  now: number = Date.now(),
): WindowedTrades {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const windowed = trades.filter((trade: any) => {
    const raw = trade.exitTime || trade.entryTime;
    // Missing or unparseable dates stay visible — never hide data over a
    // formatting quirk (an open trade or odd CSV row is not an "old" trade)
    if (!raw) return true;
    const when = Date.parse(raw);
    return Number.isNaN(when) || when >= cutoff;
  });
  return { trades: windowed, hiddenCount: trades.length - windowed.length };
}
