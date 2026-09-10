import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reproduction for the recurring account/trade loss (Abdoul, 2026-08-31 and
// again 2026-09-10). A device that wrote to `accounts` before its initial pull
// finished gets that key marked "dirty" (an unsynced local edit). From then on
// the engine BOTH refuses to pull `accounts` from the cloud AND flushes the
// device's own stale list over the cloud copy on every enable(), silently
// deleting accounts created on another device — and orphaning their trades.

const remote: Record<string, string> = {};
const pushed: Array<{ key: string; value: string }> = [];

vi.mock('@/lib/firebase-lazy', () => ({
  getFirebaseAuth: async () => ({ currentUser: { uid: 'u1' } }),
  getFirebaseFirestore: async () => ({}),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: () => ({}),
  httpsCallable: (_fns: unknown, name: string) =>
    async (payload: { key: string; value: string }) => {
      if (name === 'getSyncData') return { data: { data: { ...remote } } };
      if (name === 'syncData') {
        pushed.push({ key: payload.key, value: payload.value });
        remote[payload.key] = payload.value;
        return { data: { success: true } };
      }
      return { data: {} };
    },
}));

import { SyncEngine } from './sync-engine';
import { SYNC_DIRTY_PREFIX, setSyncRef } from '@/utils/user-storage';

const UID = 'u1';

// What the cloud holds: three accounts, two of them created on another device.
const CLOUD_ACCOUNTS = JSON.stringify([
  { id: 'account-1784929244468', name: 'propfirm' },
  { id: 'account-1785841647961', name: 'Recovered account (Aug 4)' },
  { id: 'account-1786386750593', name: 'Recovered account (Aug 10)' },
]);

// What the stale device holds: only the account it knew about.
const STALE_ACCOUNTS = JSON.stringify([
  { id: 'account-1784929244468', name: 'propfirm' },
]);

// Trades belonging to the two accounts the stale device has never seen.
const CLOUD_TRADES = JSON.stringify([
  { id: 't1', accountId: 'account-1785841647961' },
  { id: 't2', accountId: 'account-1786386750593' },
]);

const ids = (json: string) => JSON.parse(json).map((a: { id: string }) => a.id).sort();

describe('stale device with an unsynced accounts edit', () => {
  beforeEach(() => {
    localStorage.clear();
    for (const k of Object.keys(remote)) delete remote[k];
    pushed.length = 0;
    setSyncRef(null);
    remote.accounts = CLOUD_ACCOUNTS;
    remote.trades = CLOUD_TRADES;
    localStorage.setItem(`user_${UID}_accounts`, STALE_ACCOUNTS);
    localStorage.setItem(`user_${UID}_trades`, CLOUD_TRADES);
    // The dirty mark a pre-initial-pull write to `accounts` leaves behind.
    localStorage.setItem(SYNC_DIRTY_PREFIX + UID, JSON.stringify(['accounts']));
  });

  it('must not delete cloud accounts it has never seen', async () => {
    const engine = new SyncEngine(UID);
    await engine.enable();
    engine.disable();

    expect(ids(remote.accounts)).toEqual([
      'account-1784929244468',
      'account-1785841647961',
      'account-1786386750593',
    ]);
  });

  it('must not leave trades pointing at accounts that no longer exist', async () => {
    const engine = new SyncEngine(UID);
    await engine.enable();
    engine.disable();

    const accountIds = new Set(JSON.parse(remote.accounts).map((a: { id: string }) => a.id));
    const orphans = JSON.parse(remote.trades).filter(
      (t: { accountId: string }) => !accountIds.has(t.accountId),
    );
    expect(orphans).toEqual([]);
  });
});

describe('stale device with an unsynced trades edit', () => {
  beforeEach(() => {
    localStorage.clear();
    for (const k of Object.keys(remote)) delete remote[k];
    pushed.length = 0;
    setSyncRef(null);
    localStorage.setItem(SYNC_DIRTY_PREFIX + UID, JSON.stringify(['trades']));
  });

  it('must not delete cloud trades it has never seen, and keeps its own unsynced one', async () => {
    remote.trades = JSON.stringify([
      { id: 'cloud-1', accountId: 'a' },
      { id: 'cloud-2', accountId: 'a' },
    ]);
    // This device is behind: it never saw cloud-2, and has an unsynced trade.
    localStorage.setItem(`user_${UID}_trades`, JSON.stringify([
      { id: 'cloud-1', accountId: 'a' },
      { id: 'local-only', accountId: 'a' },
    ]));

    const engine = new SyncEngine(UID);
    await engine.enable();
    engine.disable();

    const finalIds = JSON.parse(remote.trades).map((t: { id: string }) => t.id).sort();
    expect(finalIds).toEqual(['cloud-1', 'cloud-2', 'local-only']);
  });
});
