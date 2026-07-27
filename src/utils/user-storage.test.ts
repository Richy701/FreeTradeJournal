import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStorage, setSyncRef, markSyncKeyDirtyOffline, SYNC_DIRTY_PREFIX } from './user-storage';

const UID = 'test-user';
const ledger = () => JSON.parse(localStorage.getItem(SYNC_DIRTY_PREFIX + UID) || '[]');

describe('offline sync dirty-marking', () => {
  beforeEach(() => {
    localStorage.clear();
    setSyncRef(null);
  });

  it('marks a synced key edited while no engine is running', async () => {
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]');
    expect(ledger()).toEqual(['trades']);
  });

  it('accumulates keys without duplicates', async () => {
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]');
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"},{"id":"t2"}]');
    await UserStorage.setItem(UID, 'journalEntries', '[{"id":"j1"}]');
    expect(ledger().sort()).toEqual(['journalEntries', 'trades']);
  });

  it('does not mark seed-shaped writes (empty payloads)', async () => {
    await UserStorage.setItem(UID, 'trades', '[]');
    await UserStorage.setItem(UID, 'goals', '{}');
    expect(ledger()).toEqual([]);
  });

  it('does not mark settings (protected by its own dirty flag)', async () => {
    await UserStorage.setItem(UID, 'settings', '{"theme":"dark"}');
    expect(ledger()).toEqual([]);
  });

  it('does not mark a default-only accounts seed, but marks real accounts', async () => {
    await UserStorage.setItem(UID, 'accounts', '[{"id":"default-1","name":"Main"}]');
    expect(ledger()).toEqual([]);
    await UserStorage.setItem(UID, 'accounts', '[{"id":"acc-7","name":"Funded"}]');
    expect(ledger()).toEqual(['accounts']);
  });

  it('does not mark non-synced keys or skipSync writes', async () => {
    await UserStorage.setItem(UID, 'riskRulesViolationDate', '2026-07-27');
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]', true);
    expect(ledger()).toEqual([]);
  });

  it('does not mark demo or guest writes', async () => {
    await UserStorage.setItem('demo-user', 'trades', '[{"id":"t1"}]');
    await UserStorage.setItem(null, 'trades', '[{"id":"t1"}]');
    expect(localStorage.getItem(SYNC_DIRTY_PREFIX + 'demo-user')).toBeNull();
  });

  it('delegates to the sync engine instead when one is wired', async () => {
    const syncKey = vi.fn();
    setSyncRef({ syncKey });
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]');
    expect(syncKey).toHaveBeenCalledWith('trades', '[{"id":"t1"}]');
    expect(ledger()).toEqual([]);
  });

  it('rebuilds a corrupted ledger from the next mark', () => {
    localStorage.setItem(SYNC_DIRTY_PREFIX + UID, 'not-json');
    markSyncKeyDirtyOffline(UID, 'trades', '[{"id":"t1"}]');
    expect(ledger()).toEqual(['trades']);
  });

  it('clearUserData removes the ledger', async () => {
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]');
    UserStorage.clearUserData(UID);
    expect(localStorage.getItem(SYNC_DIRTY_PREFIX + UID)).toBeNull();
  });
});
