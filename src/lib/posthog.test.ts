// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A stand-in for the posthog-js default export that records the order of
// calls made against it. `failLoad` makes the dynamic import reject, which is
// what a blocked or missing SDK chunk looks like to the app.
const sdk = vi.hoisted(() => ({
  failLoad: false,
  calls: [] as string[],
  identified: false,
  flagHandlers: [] as Array<() => void>,
  client: {
    init: vi.fn(() => { sdk.calls.push('init'); }),
    capture: vi.fn((event: string) => { sdk.calls.push(`capture:${event}`); }),
    identify: vi.fn((id: string) => { sdk.calls.push(`identify:${id}`); }),
    reset: vi.fn(() => { sdk.calls.push('reset'); }),
    _isIdentified: vi.fn(() => sdk.identified),
    register: vi.fn(() => { sdk.calls.push('register'); }),
    unregister: vi.fn(() => { sdk.calls.push('unregister'); }),
    captureException: vi.fn((err: unknown) => { sdk.calls.push(`exception:${String((err as Error)?.message ?? err)}`); }),
    onFeatureFlags: vi.fn((cb: () => void) => {
      sdk.flagHandlers.push(cb);
      return () => { sdk.flagHandlers = sdk.flagHandlers.filter((h) => h !== cb); };
    }),
    set_config: vi.fn(),
    featureFlags: { getFlagVariants: () => ({}) },
  },
}));

type Facade = typeof import('./posthog');

// vi.doMock (not the hoisted vi.mock) so each test registers its own factory:
// the mock registry survives resetModules, and one test needs the import to
// reject.
async function freshModule(): Promise<Facade> {
  vi.doMock('posthog-js', async () => {
    if (sdk.failLoad) throw new Error('chunk blocked');
    return { default: sdk.client };
  });
  vi.resetModules();
  return import('./posthog');
}

// The scheduled load waits for idle/interaction; a pointerdown is the
// deterministic way to trigger it from a test.
async function triggerLoad(): Promise<void> {
  window.dispatchEvent(new Event('pointerdown'));
  await vi.waitFor(() => { if (!sdk.calls.includes('init') && !sdk.failLoad) throw new Error('not loaded'); });
  await Promise.resolve();
}

beforeEach(() => {
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))));
  sdk.failLoad = false;
  sdk.calls = [];
  sdk.identified = false;
  sdk.flagHandlers = [];
  for (const fn of Object.values(sdk.client)) if (typeof fn === 'function') fn.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('posthog facade', () => {
  it('replays calls made before the SDK loads, in the order they were made', async () => {
    const { posthog, initPostHog } = await freshModule();
    initPostHog();

    posthog.capture('$pageview');
    posthog.identify('uid-1');
    posthog.capture('page_viewed');
    expect(sdk.calls).toEqual([]);
    expect(posthog.loaded).toBe(false);

    await triggerLoad();

    expect(posthog.loaded).toBe(true);
    expect(sdk.calls).toEqual(['init', 'capture:$pageview', 'identify:uid-1', 'capture:page_viewed']);
  });

  it('sends calls straight through once loaded', async () => {
    const { posthog, initPostHog } = await freshModule();
    initPostHog();
    await triggerLoad();
    sdk.calls = [];

    posthog.capture('later');
    expect(sdk.calls).toEqual(['capture:later']);
  });

  it('defers the identified check to the SDK so a stale identity is still dropped', async () => {
    const { posthog, initPostHog } = await freshModule();
    initPostHog();
    posthog.resetIfIdentified();
    sdk.identified = true;

    await triggerLoad();
    expect(sdk.calls).toEqual(['init', 'reset']);
  });

  it('attaches flag subscriptions after load and honours an early unsubscribe', async () => {
    const { posthog, initPostHog } = await freshModule();
    initPostHog();
    const kept = vi.fn();
    const dropped = vi.fn();
    posthog.onFeatureFlags(kept);
    const unsubscribe = posthog.onFeatureFlags(dropped);
    unsubscribe();

    await triggerLoad();
    expect(sdk.client.onFeatureFlags).toHaveBeenCalledTimes(1);
    expect(sdk.client.onFeatureFlags).toHaveBeenCalledWith(kept);
  });

  it('reports errors thrown before the SDK loaded', async () => {
    const { initPostHog } = await freshModule();
    initPostHog();

    window.dispatchEvent(new ErrorEvent('error', { error: new Error('first paint crash') }));

    await vi.waitFor(() => { if (!sdk.calls.includes('init')) throw new Error('not loaded'); });
    expect(sdk.calls).toEqual(['init', 'exception:first paint crash']);
    expect(sdk.client.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'first paint crash' }),
      { before_sdk_load: true },
    );
  });

  it('marks analytics blocked and drops the queue when the SDK chunk fails to load', async () => {
    sdk.failLoad = true;
    const { posthog, initPostHog, isAnalyticsBlocked } = await freshModule();
    initPostHog();
    posthog.capture('lost');

    window.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => { if (!isAnalyticsBlocked()) throw new Error('not blocked yet'); });

    expect(posthog.loaded).toBe(false);
    expect(sdk.calls).toEqual([]);
  });
});
