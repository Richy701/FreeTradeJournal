// Local-only fixture for import-preview-check.mjs: the real ImportPreviewDialog
// fed by the real planImport, with contexts stubbed.
import { createRoot } from 'react-dom/client';
import { ImportPreviewDialog } from '@/components/import-preview-dialog';
import { buildImportedTrades, planImport } from '@/utils/import-trades';
import type { CSVParseResult, ParsedTrade } from '@/utils/csv-parser';
import '@/index.css';

const scenario = new URLSearchParams(location.search).get('scenario') || 'new';

const pad = (n: number) => String(n).padStart(2, '0');
function trade(i: number, over: Partial<ParsedTrade> = {}): ParsedTrade {
  const day = 28 + Math.floor(i / 9);
  const date = day <= 31 ? `2026-01-${pad(day)}` : `2026-02-${pad(day - 31)}`;
  const entry = 5160 + i * 1.3;
  const pnl = i % 4 === 3 ? 0 : i % 3 === 0 ? -(60 + i * 2) : 185 + i * 5;
  return {
    symbol: i % 5 === 4 ? 'EURUSD' : 'MGCG6',
    side: i % 3 === 1 ? 'short' : 'long',
    entryPrice: i % 5 === 4 ? '1.08412' : entry.toFixed(1),
    exitPrice: i % 5 === 4 ? '1.08533' : (entry + 2.2).toFixed(1),
    quantity: i % 2 ? '10' : '5',
    pnl: String(pnl),
    date: `${date}T09:${pad(i % 60)}:00`,
    ...over,
  };
}

const opts = { fileName: 'Trade Log Apr 4 2026.csv', accountId: 'a1' };
const parsed = Array.from({ length: 139 }, (_, i) => trade(i));

function build(): { parseResult: CSVParseResult; plan: ReturnType<typeof planImport> } {
  const result = (trades: ParsedTrade[], errors: string[] = []): CSVParseResult => ({
    success: true,
    trades,
    errors,
    summary: { totalRows: trades.length + errors.length, successfulParsed: trades.length, failed: errors.length, dateRange: null },
  });
  if (scenario === 'none') {
    return { parseResult: result(parsed), plan: planImport(parsed, buildImportedTrades(parsed, opts), opts) };
  }
  if (scenario === 'errors') {
    const errors = ['Row 14: missing exit price', 'Row 52: could not read the date "31/31/2026"', 'Row 97: quantity is not a number'];
    return { parseResult: result(parsed, errors), plan: planImport(parsed, [], opts) };
  }
  if (scenario === 'blocked') {
    const future = new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 19);
    const trades = [...parsed.slice(0, 20), trade(200, { date: future })];
    return { parseResult: result(trades), plan: planImport(trades, [], { ...opts, brokerTimezone: 'America/Chicago' }) };
  }
  if (scenario === 'one') {
    const trades = parsed.slice(0, 1);
    return { parseResult: result(trades), plan: planImport(trades, [], opts) };
  }
  // 'new': 12 of the 139 are already in the journal
  return { parseResult: result(parsed), plan: planImport(parsed, buildImportedTrades(parsed.slice(50, 62), opts), opts) };
}

const { parseResult, plan } = build();

createRoot(document.getElementById('root')!).render(
  <ImportPreviewDialog
    open
    onOpenChange={() => {}}
    fileName={opts.fileName}
    parseResult={parseResult}
    plan={plan}
    importing={false}
    onCancel={() => {}}
    onConfirm={() => {}}
  />,
);
