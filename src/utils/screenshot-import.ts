import type { ParsedTrade } from './csv-parser';
import type { ScreenshotTrade } from '@/services/ai-analysis';

// Bridge from the vision model's rows to the CSV import pipeline. Everything
// downstream (gross→net P&L, broker timezone, market detection, dedupe) is the
// shared buildImportedTrades path — this file only reshapes and normalises.

// The model is asked for "YYYY-MM-DD HH:mm:ss" (or a bare date). Emit the same
// naive local-wall-clock ISO shape the CSV parser emits so buildImportedTrades
// treats both sources identically. Returns '' when nothing usable is present so
// the review table can flag the row instead of silently stamping "now".
export function normalizeScreenshotTime(value: string | null | undefined): string {
  if (!value) return '';
  const v = value.trim();
  if (!v) return '';
  const m = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (m) {
    const [, y, mo, d, h = '00', mi = '00', s = '00'] = m;
    const pad = (n: string) => n.padStart(2, '0');
    return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${mi}:${s}`;
  }
  // Day-first with dots/slashes/dashes ("15.08.2026 14:30" MT desktop style,
  // "19-08-2026" Indian broker style). ISO ran first, so a 1-2 digit lead is day.
  const dm = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (dm) {
    const [, d, mo, y, h = '00', mi = '00', s = '00'] = dm;
    const pad = (n: string) => n.padStart(2, '0');
    return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${mi}:${s}`;
  }
  const dt = new Date(v);
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

// A row the user reviews before import. `keep` starts false for rows we can't
// place in time; `lowConfidence` tints the row so the user checks it.
export interface ReviewTrade extends ParsedTrade {
  id: string;
  keep: boolean;
  lowConfidence: boolean;
  duplicate: boolean;
}

export function screenshotTradesToReview(trades: ScreenshotTrade[]): ReviewTrade[] {
  return trades.map((t, i) => {
    const entryDate = normalizeScreenshotTime(t.openTime);
    const exitDate = normalizeScreenshotTime(t.closeTime) || entryDate;
    // Platforms print costs signed (MT5: commission -3.50, swap -0.42). The app
    // stores costs as positive amounts, so flip sign: a printed +swap credit
    // becomes a negative cost and correctly raises net P&L.
    const cost = (v: number | null) => (v === null || v === 0 ? undefined : String(-v));
    const missingTime = !entryDate;
    return {
      id: `shot-${i}`,
      symbol: t.symbol.toUpperCase(),
      side: t.side,
      entryPrice: String(t.entryPrice),
      exitPrice: String(t.exitPrice),
      quantity: String(t.quantity),
      pnl: String(t.pnl),
      date: entryDate,
      entryDate: entryDate || undefined,
      exitDate: exitDate || undefined,
      commission: t.commission === null || t.commission === 0 ? undefined : String(Math.abs(t.commission)),
      fees: t.fees === null || t.fees === 0 ? undefined : String(Math.abs(t.fees)),
      swap: cost(t.swap),
      keep: !missingTime,
      lowConfidence: t.confidence === 'low' || missingTime,
      duplicate: false,
    };
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
