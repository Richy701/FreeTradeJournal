import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useAutoRestore } from './use-auto-restore';
const mocks = vi.hoisted(() => ({ uid: 'first', isPro: true, load: vi.fn(), notify: vi.fn() }));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { uid: mocks.uid } }) }));
vi.mock('@/contexts/pro-context', () => ({ useProStatus: () => ({ isPro: mocks.isPro, isLoading: false }) }));
vi.mock('@/contexts/sync-context', () => ({ notifyDataChange: mocks.notify }));
vi.mock('@/lib/firebase-lazy', () => ({ getFirebaseAuth: async () => ({}) }));
vi.mock('firebase/functions', () => ({ getFunctions: () => ({}), httpsCallable: () => mocks.load }));
let root: Root;
let latest: ReturnType<typeof useAutoRestore>;
function Probe() { latest = useAutoRestore(); return null; }
function mount() { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); root = createRoot(document.createElement('div')); }
afterEach(() => { act(() => root?.unmount()); localStorage.clear(); vi.clearAllMocks(); mocks.uid = 'first'; mocks.isPro = true; });
it('restores a Pro account even when storage has empty seeded keys', async () => {
  localStorage.setItem('user_first_trades', '[]');
  localStorage.setItem('user_first_accounts', '[]');
  mocks.load.mockResolvedValueOnce({ data: { data: { trades: '[{"id":"saved-trade"}]' } } });
  mount(); await act(async () => root.render(<Probe />));
  expect(mocks.load).toHaveBeenCalledOnce();
  expect(localStorage.getItem('user_first_trades')).toContain('saved-trade');
  expect(latest).toEqual({ isRestoring: false, restoreComplete: true, restoreFailed: false });
});
it('does not apply the previous account’s in-flight restore after switching users', async () => {
  let resolve!: (value: unknown) => void;
  mocks.load.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  mount(); await act(async () => root.render(<Probe />));
  expect(latest.restoreComplete).toBe(false);
  mocks.uid = 'second'; mocks.isPro = false;
  await act(async () => root.render(<Probe />));
  await act(async () => resolve({ data: { data: { trades: '[{"id":"old"}]' } } }));
  expect(localStorage.getItem('user_first_trades')).toBeNull();
  expect(localStorage.getItem('user_second_trades')).toBeNull();
  expect(mocks.notify).not.toHaveBeenCalled();
  expect(latest.restoreComplete).toBe(true);
});
it('reports restoration failure so routing can protect a returning user', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.load.mockRejectedValueOnce(new Error('offline'));
  mount(); await act(async () => root.render(<Probe />));
  expect(latest).toEqual({ isRestoring: false, restoreComplete: true, restoreFailed: true });
  log.mockRestore();
});
