// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeeklyFocus } from './use-weekly-focus';
import { localDay, type FocusPlan } from '@/lib/weekly-focus';

const mock = vi.hoisted(() => {
  const state = { value: null as string | null, fail: false };
  const storage = {
    getItem: vi.fn(() => state.value),
    setItem: vi.fn(async (_key: string, value: string, skipSync = false) => {
      state.value = value; // UserStorage's optimistic encryption cache.
      if (state.fail && !skipSync) throw new Error('Storage is full');
    }),
  };
  return { state, storage, track: vi.fn(), error: vi.fn(), notify: vi.fn() };
});
vi.mock('@/utils/user-storage', () => ({ useUserStorage: () => mock.storage }));
vi.mock('@/lib/analytics', () => ({ trackEvent: mock.track }));
vi.mock('sonner', () => ({ toast: { error: mock.error } }));
vi.mock('@/contexts/sync-context', () => ({ onSyncChange: () => () => {}, getChangeVersion: () => 0, notifyDataChange: mock.notify }));

let root: Root;
let container: HTMLDivElement;
let state: ReturnType<typeof useWeeklyFocus>;
function Harness() { state = useWeeklyFocus(); return <p>{state.error ?? state.records.length}</p>; }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  mock.state.value = null;
  mock.state.fail = false;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const plan = (): FocusPlan => ({kind: 'plan', id: 'plan', accountId: 'a', createdAt: new Date().toISOString(), startDate: localDay(), habit: 'Write my entry reason before each trade.'});

describe('weekly focus saving', () => {
  it('restores the optimistic cache and reports failure without a success event', async () => {
    mock.state.fail = true;
    act(() => root.render(<Harness />));
    let saved = true;
    await act(async () => { saved = await state.save(plan()); });
    expect(saved).toBe(false);
    expect(mock.state.value).toBe('[]');
    expect(mock.error).toHaveBeenCalledWith('Storage is full');
    expect(mock.track).not.toHaveBeenCalled();
    expect(mock.storage.setItem.mock.calls[1][2]).toBe(true);
  });
  it('preserves corrupt data and does not attempt to overwrite it', async () => {
    mock.state.value = '{corrupt';
    act(() => root.render(<Harness />));
    expect(state.error).toBeTruthy();
    await act(async () => { await state.save(plan()); });
    expect(mock.storage.setItem).not.toHaveBeenCalled();
    expect(mock.state.value).toBe('{corrupt');
  });
  it('blocks a double submit and records success only after persistence', async () => {
    act(() => root.render(<Harness />));
    let results: boolean[] = [];
    await act(async () => { results = await Promise.all([state.save(plan()), state.save({...plan(), id: 'duplicate'})]); });
    expect(results).toEqual([true, false]);
    expect(JSON.parse(mock.state.value!)).toHaveLength(1);
    expect(mock.track).toHaveBeenCalledOnce();
  });
});
