// Single source of truth for "does this record belong to this account?".
// Every view (TradeLog, Dashboard widgets, calendar, Journal, Settings) must
// filter through this — the previous seven inline copies drifted and orphaned
// trades stamped with phantom ids.

// Ids stamped by old code paths when no account was loaded yet. No account is
// ever created with these ids, so records carrying them (or no accountId at
// all) are treated as belonging to the user's default account.
const LEGACY_ACCOUNT_IDS = ['default-main-account', 'default'];

// True when a record has no real owning account and rides in the legacy
// "default" bucket. Used when deleting the default account so these records
// can be re-stamped instead of becoming invisible.
export function isLegacyRecord(record: { accountId?: string | null }): boolean {
  return !record.accountId || LEGACY_ACCOUNT_IDS.includes(record.accountId);
}

export function belongsToAccount(
  record: { accountId?: string | null },
  accountId: string,
): boolean {
  if (record.accountId === accountId) return true;
  const isLegacy = !record.accountId || LEGACY_ACCOUNT_IDS.includes(record.accountId);
  return isLegacy && accountId.includes('default');
}
