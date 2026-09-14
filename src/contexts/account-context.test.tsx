// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider, useAccounts } from './account-context';
import { UserStorage } from '@/utils/user-storage';

// Real sync-change semantics: notifyDataChange bumps the version and calls
// listeners synchronously, exactly like src/contexts/sync-context.tsx.
const sync = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { version: 0 };
  return {
    state,
    getChangeVersion: () => state.version,
    onSyncChange: (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    notifyDataChange: () => { state.version++; listeners.forEach(cb => cb()); },
  };
});
vi.mock('@/contexts/sync-context', () => ({ ...sync, useSync: () => ({ initialSyncDone: true }) }));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { uid: 'u1' }, isDemo: false }) }));
vi.mock('@/contexts/pro-context', () => ({ useProStatus: () => ({ isPro: true }) }));
vi.mock('@/hooks/use-demo-guard', () => ({ useDemoGuard: () => () => false }));
vi.mock('@/lib/track-activity', () => ({ trackGateHit: vi.fn() }));
vi.mock('@/utils/trade-migration', () => ({ migrateTradesToAccountId: () => ({ migrated: 0, total: 0 }) }));
vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }));

const uid = 'u1';
const main = { id: 'default-1', name: 'Main', type: 'live', broker: 'A', currency: 'USD', isDefault: true, createdAt: '2026-01-01' };
const prop = { id: 'account-2', name: 'Prop', type: 'prop-firm', broker: 'B', currency: 'USD', isDefault: false, createdAt: '2026-02-01' };

let root: Root;
let container: HTMLDivElement;
let ctx: ReturnType<typeof useAccounts>;
function Harness() { ctx = useAccounts(); return <p>{ctx.accounts.map(a => a.id).join(',')}</p>; }

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  await UserStorage.setItem(uid, 'accounts', JSON.stringify([main, prop]), true);
  await UserStorage.setItem(uid, 'active-account-id', prop.id, true);
  await UserStorage.setItem(uid, 'trades', JSON.stringify([{ id: 't1', accountId: main.id }, { id: 't2', accountId: prop.id }]), true);
  await UserStorage.setItem(uid, 'journalEntries', JSON.stringify([{ id: 'j1', accountId: prop.id }]), true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<AccountProvider><Harness /></AccountProvider>));
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('deleting a trading account', () => {
  it('removes the account, keeps it removed after the data-change reload, and drops only its records', () => {
    expect(ctx.accounts.map(a => a.id)).toEqual([main.id, prop.id]);
    expect(ctx.activeAccount?.id).toBe(prop.id);

    act(() => ctx.deleteAccount(prop.id));

    expect(container.textContent).toBe(main.id);
    expect(ctx.accounts.map(a => a.id)).toEqual([main.id]);
    expect(JSON.parse(UserStorage.getItem(uid, 'accounts')!).map((a: { id: string }) => a.id)).toEqual([main.id]);
    expect(ctx.activeAccount?.id).toBe(main.id);
    expect(UserStorage.getItem(uid, 'active-account-id')).toBe(main.id);
    expect(JSON.parse(UserStorage.getItem(uid, 'trades')!).map((t: { id: string }) => t.id)).toEqual(['t1']);
    expect(JSON.parse(UserStorage.getItem(uid, 'journalEntries')!)).toEqual([]);
  });
});
