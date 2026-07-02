// Learning + telemetry for CSV imports, shared by the Trade Log and Dashboard
// import flows so the two can't diverge.
//
//  • #2 (telemetry): we already log auto-detect misses. `trackImportMapped` adds
//    the high-value signal — the exact role -> column-name mapping a real user
//    used to rescue an unrecognized format. That's a ready-made spec for a future
//    built-in broker detector. Column NAMES only — never row/trade data — so
//    nothing here carries PII.
//  • #1 (memory): when a user manually maps an unknown format, we remember it
//    keyed by the file's header signature, then silently replay that mapping the
//    next time the same broker export shows up. The app learns each user's
//    brokers instead of waiting for us to ship a parser.
import { trackEvent } from '@/lib/analytics';

const MEMORY_KEY = 'csvImportMappings';
// Cap remembered signatures so a user with many broker formats can't grow this
// blob without bound; oldest entries are evicted first.
const MAX_REMEMBERED = 25;

// Roles that must resolve for a remembered mapping to be usable on replay.
export const REQUIRED_ROLES = ['symbol', 'side', 'openPrice', 'closePrice', 'quantity', 'pnl'] as const;

// Minimal slice of UserStorage's hook API (get sync, set may be async).
export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void | Promise<void>;
}

// Stable fingerprint of a file's shape: its set of column names, normalized and
// order-independent. The same broker export yields the same signature no matter
// the row data or (thanks to sorting) a reordered column layout.
export function headerSignature(headers: string[]): string {
  return headers
    .map(h => h.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
}

// Resolve a role -> column-index mapping into role -> column-NAME, dropping any
// unmapped (index < 0) roles. Names are what we persist/report: they survive
// column reordering and are human-readable in analytics.
function toNamedColumns(headers: string[], mappings: Record<string, number>): Record<string, string> {
  const columns: Record<string, string> = {};
  for (const [role, idx] of Object.entries(mappings)) {
    if (idx >= 0 && headers[idx]) columns[role] = headers[idx].trim();
  }
  return columns;
}

interface RememberedEntry {
  columns: Record<string, string>; // role -> column name
  updatedAt: number;
}
type RememberedMappings = Record<string, RememberedEntry>;

function load(storage: StorageLike): RememberedMappings {
  try {
    const raw = storage.getItem(MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

// #2 — Report the exact mapping a user used to rescue an unrecognized format.
export function trackImportMapped(source: string, headers: string[], mappings: Record<string, number>): void {
  trackEvent('csv_import_mapped', {
    source,
    signature: headerSignature(headers),
    column_count: headers.length,
    mapping: toNamedColumns(headers, mappings), // role -> column name, no row data
  });
}

// #1 — Persist a user-confirmed mapping keyed by header signature.
export function rememberMapping(storage: StorageLike, headers: string[], mappings: Record<string, number>): void {
  const sig = headerSignature(headers);
  if (!sig) return;
  const columns = toNamedColumns(headers, mappings);
  if (Object.keys(columns).length === 0) return;

  const all = load(storage);
  all[sig] = { columns, updatedAt: Date.now() };

  // Evict oldest beyond the cap.
  const entries = Object.entries(all);
  if (entries.length > MAX_REMEMBERED) {
    entries.sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    for (const [key] of entries.slice(0, entries.length - MAX_REMEMBERED)) delete all[key];
  }

  try { void storage.setItem(MEMORY_KEY, JSON.stringify(all)); } catch { /* quota — non-critical */ }
}

// Resolve a role -> column-NAME map into role -> column-index against the given
// header row. Returns null unless every REQUIRED_ROLE resolves to a real column,
// so a partial/stale mapping falls back to the manual dialog. Shared by memory
// recall and the AI mapper (whose output is also role -> column name).
export function resolveNamedMapping(
  headers: string[],
  columns: Record<string, string | null | undefined>
): Record<string, number> | null {
  const lower = headers.map(h => h.trim().toLowerCase());
  const mappings: Record<string, number> = {};
  for (const [role, name] of Object.entries(columns)) {
    if (!name) continue;
    mappings[role] = lower.indexOf(name.trim().toLowerCase()); // -1 if column absent
  }
  for (const role of REQUIRED_ROLES) {
    if (mappings[role] === undefined || mappings[role] < 0) return null;
  }
  return mappings;
}

// #1 — Recall a remembered mapping for this file, re-resolving stored column
// names to indices in the CURRENT header row. Returns null when nothing is
// remembered or any required role's column is no longer present (so the caller
// falls back to the manual mapping dialog).
export function recallMapping(storage: StorageLike, headers: string[]): Record<string, number> | null {
  const sig = headerSignature(headers);
  if (!sig) return null;
  const remembered = load(storage)[sig];
  if (!remembered) return null;
  return resolveNamedMapping(headers, remembered.columns);
}
