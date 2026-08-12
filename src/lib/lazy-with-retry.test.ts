import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWithRetry, installStaleChunkReloadListener } from './lazy-with-retry';

const RELOAD_KEY = 'chunk-reload-at';

const reload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { ...window.location, reload },
  writable: true,
  configurable: true,
});

const component = { default: (() => null) as any };
const ok = () => Promise.resolve(component);
const fails = () => Promise.reject(new Error('Failed to fetch dynamically imported module'));

/** The failure path never resolves (a reload is in flight), so wait on the effect. */
async function settle() {
  await vi.waitFor(() => expect(reload).toHaveBeenCalled());
}

describe('loadWithRetry', () => {
  beforeEach(() => {
    reload.mockClear();
    window.sessionStorage.clear();
  });

  it('resolves the module when the chunk loads', async () => {
    await expect(loadWithRetry(ok)).resolves.toBe(component);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once on a stale-chunk failure', async () => {
    void loadWithRetry(fails);
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // Regression: the guard used to be a boolean cleared by every successful
  // load. App.tsx mounts several lazyWithRetry components unconditionally, so a
  // cache-warm chunk wiped the flag on each load while the failing chunk
  // re-armed it — an unbounded reload loop. One UAE client did 610 document
  // loads in three minutes off this.
  it('does not let a successful chunk re-arm the reload guard', async () => {
    void loadWithRetry(fails);
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    // A sibling chunk resolves after the failing one triggered the reload.
    await expect(loadWithRetry(ok)).resolves.toBe(component);

    // The next failure must surface, not reload again.
    await expect(loadWithRetry(fails)).rejects.toThrow('Failed to fetch');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('surfaces the error once the cooldown guard is set', async () => {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    await expect(loadWithRetry(fails)).rejects.toThrow('Failed to fetch');
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads again once the cooldown has expired', async () => {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now() - 60_000));
    void loadWithRetry(fails);
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads when sessionStorage is blocked', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

    try {
      await expect(loadWithRetry(fails)).rejects.toThrow('Failed to fetch');
      expect(reload).not.toHaveBeenCalled();
    } finally {
      setItem.mockRestore();
    }
  });

  // The vite:preloadError listener preventDefault()s a failure it is healing,
  // which makes the wrapped import resolve with no module. That must suspend,
  // not hand React an undefined component.
  it('suspends instead of resolving when the import yields no module', async () => {
    const outcome = vi.fn();
    void loadWithRetry(() => Promise.resolve(undefined as any)).then(outcome, outcome);
    await new Promise((r) => setTimeout(r, 20));
    expect(outcome).not.toHaveBeenCalled();
  });
});

describe('installStaleChunkReloadListener', () => {
  beforeEach(() => {
    reload.mockClear();
    window.sessionStorage.clear();
  });

  function dispatchPreloadError(): Event {
    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);
    return event;
  }

  it('cancels the event and reloads on the first stale-chunk failure', async () => {
    installStaleChunkReloadListener();
    const event = dispatchPreloadError();
    expect(event.defaultPrevented).toBe(true);
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('lets the error surface while the cooldown guard is set', () => {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    installStaleChunkReloadListener();
    const event = dispatchPreloadError();
    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
