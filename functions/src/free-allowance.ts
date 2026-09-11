// Free allowances that must survive delete-and-resignup. The free AI quota
// (users/{uid}/meta/freeAiUsage) and the free screenshot-import count
// (meta/screenshotImport) are keyed by uid, so deleting the account and signing
// up again used to hand the same email a full allowance. deleteUserAccount now
// copies the counts onto the email-hash tombstone and onUserCreated restores
// them. Both sides keep the HIGHER count per counter, so neither ordering (an
// auto AI call landing before the restore, or a deletion before any AI use)
// can reset a quota.

export interface FreeAiUsageDoc {
  month?: string;
  count?: number;
  coaching?: number;
  utility?: number;
  autoDay?: string | null;
  auto?: number;
}

// Merge two freeAiUsage docs for the current period: monthly counters only
// count when they belong to `monthStr`, the auto cap only when it belongs to
// `todayStr`. Returns null when there is nothing left to carry.
export function mergeFreeAiUsage(
  a: FreeAiUsageDoc | undefined | null,
  b: FreeAiUsageDoc | undefined | null,
  monthStr: string,
  todayStr: string,
): FreeAiUsageDoc | null {
  const monthly = (d: FreeAiUsageDoc | undefined | null, key: "count" | "coaching" | "utility") =>
    d?.month === monthStr ? Number(d?.[key]) || 0 : 0;
  const daily = (d: FreeAiUsageDoc | undefined | null) =>
    d?.autoDay === todayStr ? Number(d?.auto) || 0 : 0;

  const merged = {
    month: monthStr,
    count: Math.max(monthly(a, "count"), monthly(b, "count")),
    coaching: Math.max(monthly(a, "coaching"), monthly(b, "coaching")),
    utility: Math.max(monthly(a, "utility"), monthly(b, "utility")),
    autoDay: todayStr as string | null,
    auto: Math.max(daily(a), daily(b)),
  };
  if (merged.auto === 0) merged.autoDay = null;
  if (!merged.count && !merged.coaching && !merged.utility && !merged.auto) return null;
  return merged;
}
