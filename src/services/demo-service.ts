import {
  DEMO_TRADES,
  DEMO_JOURNAL_ENTRIES,
  DEMO_ACCOUNTS,
  DEMO_ACCOUNT_ID,
  DEMO_PROP_ACCOUNTS,
  DEMO_PROP_TRANSACTIONS,
  DEMO_TRADING_GOALS,
  DEMO_TRADING_RISK_RULES,
} from '@/data/demo-data';
import { UserStorage } from '@/utils/user-storage';

// The fake uid used to scope the demo sandbox in localStorage. Every demo write
// lands under `user_demo-user_*` and is wiped on exit, so it never touches a
// real user's data and never syncs to the cloud.
export const DEMO_UID = 'demo-user';

/**
 * Seed the demo dataset into demo-user-scoped storage so the sandbox uses the
 * exact same read/write code path as a real account. Call on entering demo
 * mode (after clearDemoStorage). Idempotent: overwrites any existing demo keys.
 * Writes are sync-skipped — demo data must never reach the cloud.
 */
export async function seedDemoStorage(): Promise<void> {
  // Demo trades predate the lotSize field: they carry raw `quantity` units
  // (200000 = 2 forex lots). Derive lotSize at seed time so tables and P&L
  // math show real values instead of blank cells.
  const tradesWithLots = DEMO_TRADES.map((t: any) => ({
    ...t,
    lotSize: t.lotSize ?? (t.instrumentType === 'forex' ? t.quantity / 100000 : t.quantity),
  }));
  const seed: Array<[string, string]> = [
    ['trades', JSON.stringify(tradesWithLots)],
    ['journalEntries', JSON.stringify(DEMO_JOURNAL_ENTRIES)],
    ['accounts', JSON.stringify(DEMO_ACCOUNTS)],
    ['active-account-id', DEMO_ACCOUNT_ID],
    ['propFirmAccounts', JSON.stringify(DEMO_PROP_ACCOUNTS)],
    ['propFirmTransactions', JSON.stringify(DEMO_PROP_TRANSACTIONS)],
    ['tradingGoals', JSON.stringify(DEMO_TRADING_GOALS)],
    ['riskRules', JSON.stringify(DEMO_TRADING_RISK_RULES)],
    ['onboardingCompleted', 'true'],
  ];
  await Promise.all(
    seed.map(([key, value]) => UserStorage.setItem(DEMO_UID, key, value, /* skipSync */ true))
  );
}

/** Wipe all demo-user-scoped storage. Call on exiting demo mode / logout. */
export function clearDemoStorage(): void {
  UserStorage.clearUserData(DEMO_UID);
}
