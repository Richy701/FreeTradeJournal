import type { PostHog, Properties } from 'posthog-js';
import { analyticsConsentGiven } from './cookie-consent';
import { getLoopCrashContext, isUpdateLoopError } from './loop-crash-context'

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = '/api/ingest';

// posthog-js is ~75 KB gzipped, over a third of the main chunk. It is loaded
// on demand (idle slice or first interaction) so the landing page can paint
// without downloading or parsing it first. Nothing about the app's analytics
// calls changes: this module exposes a thin facade with the same method names,
// and every call made before the SDK arrives is queued and replayed in order
// once it has initialised. Calling the real SDK before init would silently
// drop the event (it logs "You must initialize PostHog" and returns).

type Thunk = (ph: PostHog) => void;

let client: PostHog | null = null;
let queue: Thunk[] = [];
let loadPromise: Promise<PostHog | null> | null = null;

// Set once we detect the analytics endpoint is blocked (ad blocker) or
// unreachable. Funnel-critical events (signup / first trade / subscription) are
// captured server-side via Cloud Functions, so when this trips we lose only
// optional client product analytics — and we stop posthog-js from retry-storming
// every blocked request into the console. Session-scoped (re-probed each load)
// so a transient network blip self-heals instead of poisoning analytics.
let blocked = false;
export function isAnalyticsBlocked(): boolean {
  return blocked;
}

function run(thunk: Thunk): void {
  if (client) {
    try {
      thunk(client);
    } catch {
      // Analytics must never break the app
    }
    return;
  }
  queue.push(thunk);
}

/**
 * Same surface the app used on the posthog-js singleton. Fire-and-forget calls
 * queue until the SDK is loaded; synchronous reads return "not available"
 * until then (feature-flag helpers already fall back for that case).
 */
export const posthog = {
  get loaded(): boolean {
    return client !== null;
  },
  capture(event: string, properties?: Properties): void {
    run((ph) => { ph.capture(event, properties); });
  },
  identify(distinctId: string, properties?: Properties): void {
    run((ph) => { ph.identify(distinctId, properties); });
  },
  reset(): void {
    run((ph) => { ph.reset(); });
  },
  // Deferred check + reset in one step: the "is identified" answer isn't
  // knowable before the SDK restores its persisted identity, so callers can't
  // read it synchronously and decide for themselves.
  resetIfIdentified(): void {
    run((ph) => { if (ph._isIdentified()) ph.reset(); });
  },
  register(properties: Properties): void {
    run((ph) => { ph.register(properties); });
  },
  unregister(property: string): void {
    run((ph) => { ph.unregister(property); });
  },
  captureException(error: unknown, properties?: Properties): void {
    run((ph) => { ph.captureException(error, properties); });
  },
  isFeatureEnabled(flag: string): boolean | undefined {
    return client?.isFeatureEnabled(flag);
  },
  getFeatureFlag(flag: string): string | boolean | undefined {
    return client?.getFeatureFlag(flag);
  },
  getFlagVariants(): Record<string, string | boolean> {
    return client ? client.featureFlags.getFlagVariants() : {};
  },
  onFeatureFlags(callback: () => void): () => void {
    if (client) return client.onFeatureFlags(callback);
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    queue.push((ph) => {
      if (!cancelled) unsubscribe = ph.onFeatureFlags(callback);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  },
};

// Errors thrown before the SDK is loaded (first paint is exactly when crashes
// matter most). Buffered here, then reported through captureException once the
// SDK is up, with the same before_send filtering as live errors.
const earlyErrors: unknown[] = [];
const EARLY_ERROR_CAP = 10;
let earlyListenersInstalled = false;

function onEarlyError(event: ErrorEvent): void {
  noteEarlyError(event.error ?? event.message);
}
function onEarlyRejection(event: PromiseRejectionEvent): void {
  noteEarlyError(event.reason);
}
function noteEarlyError(error: unknown): void {
  if (earlyErrors.length < EARLY_ERROR_CAP) earlyErrors.push(error);
  // A crash this early means the page is already broken; load now so the
  // report goes out even if the user leaves.
  void load();
}
function installEarlyErrorListeners(): void {
  if (earlyListenersInstalled) return;
  earlyListenersInstalled = true;
  window.addEventListener('error', onEarlyError);
  window.addEventListener('unhandledrejection', onEarlyRejection);
}
function removeEarlyErrorListeners(): void {
  if (!earlyListenersInstalled) return;
  earlyListenersInstalled = false;
  window.removeEventListener('error', onEarlyError);
  window.removeEventListener('unhandledrejection', onEarlyRejection);
}

const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

// Longest we wait for the page's first paint before fetching the SDK anyway,
// so a stalled render can't hold analytics back indefinitely.
const PAINT_WAIT_CAP_MS = 4000;

function scheduleLoad(): void {
  const start = () => { void load(); };
  // First interaction is a stronger signal than idle: the user is doing
  // something we want to record, so stop waiting.
  for (const name of INTERACTION_EVENTS) {
    window.addEventListener(name, start, { once: true, passive: true });
  }
  // "Idle" alone fires while the browser is merely waiting on the network for
  // the page's own chunks (and the load event lands before the lazy landing
  // route has even been requested), either of which would put the SDK download
  // in competition with first paint. Gate on the paint itself, then take an
  // idle slice.
  let fired = false;
  const afterPaint = () => {
    if (fired) return;
    fired = true;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 500);
    }
  };
  try {
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((e) => e.name === 'first-contentful-paint')) {
        observer.disconnect();
        afterPaint();
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch {
    // No paint timing support: fall through to the cap below.
  }
  setTimeout(afterPaint, PAINT_WAIT_CAP_MS);
}

function load(): Promise<PostHog | null> {
  if (loadPromise) return loadPromise;
  loadPromise = import('posthog-js')
    .then(({ default: ph }) => {
      initClient(ph);
      return ph;
    })
    .catch(() => {
      // The SDK chunk itself was blocked or failed to fetch. Treat it like a
      // blocked endpoint: drop the queue and stop queuing.
      blocked = true;
      queue = [];
      removeEarlyErrorListeners();
      earlyErrors.length = 0;
      return null;
    });
  return loadPromise;
}

function initClient(ph: PostHog): void {
  const analyticsAllowed = analyticsConsentGiven();

  // The SDK attaches its own global handlers in init(); hand over first so no
  // error is seen by both.
  removeEarlyErrorListeners();

  ph.init(key, {
    api_host: host,
    ui_host: 'https://eu.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    persistence: analyticsAllowed ? 'localStorage+cookie' : 'memory',
    autocapture: analyticsAllowed,
    // Crash telemetry (replaces Sentry). Console errors are excluded — they're
    // high-volume noise (blocked third-party fetches etc.) that would burn the
    // free exception quota the same way TradingView noise burned Sentry's.
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    before_send: (event) => {
      if (event?.event === '$exception') {
        const list = event.properties?.$exception_list;
        // Rare React update-loop crash: attach what the app was doing so the
        // next occurrence names the part of the page that was refreshing.
        if (Array.isArray(list) && list.some((ex: { value?: string }) => isUpdateLoopError(ex?.value))) {
          Object.assign(event.properties, getLoopCrashContext());
        }
        const json = JSON.stringify(list ?? '');
        // Drop crashes from third-party embeds and browser extensions — not
        // actionable app errors, and TradingView's alone would eat the quota.
        if (/tradingview|chrome-extension|safari-extension|moz-extension/i.test(json)) return null;
        // Cross-origin "Script error." carries no stack frames, so the filter
        // above can't catch it and it can never be attributed to app code.
        if (
          Array.isArray(list) &&
          list.length > 0 &&
          list.every(
            (ex: { value?: string; stacktrace?: { frames?: unknown[] } }) =>
              /^Script error\.?$/.test(ex?.value ?? '') && !ex?.stacktrace?.frames?.length
          )
        ) {
          return null;
        }
      }
      return event;
    },
    // Funnel-critical events (signup / first trade / subscription) are captured
    // server-side via Cloud Functions, so the client only needs lightweight
    // product analytics. Session replay records screens full of financial data
    // (privacy liability) and dead-click capture is pure overhead — both are
    // also among the assets ad blockers reject, so we disable them outright.
    disable_session_recording: true,
    capture_dead_clicks: false,
  });

  client = ph;

  for (const error of earlyErrors.splice(0)) {
    try {
      ph.captureException(error, { before_sdk_load: true });
    } catch {
      // noop
    }
  }

  // Replay in the order the app made the calls (identify before capture etc).
  const pending = queue;
  queue = [];
  for (const thunk of pending) {
    try {
      thunk(ph);
    } catch {
      // noop
    }
  }

  detectBlocking(ph);
}

/**
 * Called once at startup. Does not download the SDK; it arms the early-error
 * buffer and schedules the real load for an idle slice or first interaction.
 */
export function initPostHog() {
  if (!key || typeof window === 'undefined') return;
  installEarlyErrorListeners();
  scheduleLoad();
}

// Ad blockers (uBlock / EasyPrivacy) reject the entire /api/ingest path
// regardless of the same-origin proxy. One HEAD probe; if it's rejected we stop
// client capture so the SDK doesn't retry every blocked event into a wall.
//
// Probes a static asset, not the capture endpoint: blockers match on the
// /api/ingest prefix so detection is identical, but a bodyless HEAD to
// /i/v0/e/ is a 400 by definition — one logged error per page load, for every
// user, describing nothing. The static path answers 200.
function detectBlocking(ph: PostHog): void {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  fetch(`${host}/static/array.js`, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    .catch(() => {
      blocked = true;
      try {
        ph.set_config({ autocapture: false, capture_pageleave: false, capture_exceptions: false });
      } catch {
        // noop
      }
    })
    .finally(() => clearTimeout(timer));
}

export function updatePostHogConsent(analyticsAllowed: boolean) {
  // Before the SDK loads there is nothing stored yet, and init reads the
  // consent cookie itself, so a change made this early needs no action.
  if (!client) return;

  if (analyticsAllowed) {
    client.set_config({ persistence: 'localStorage+cookie', autocapture: true });
  } else {
    // Withdrawing consent must actually remove what was stored, not just stop
    // writing to it. reset() drops the identity, then the ph_* cookie and
    // localStorage entries are cleared by hand because switching persistence
    // to memory leaves them in place.
    client.reset();
    client.set_config({ persistence: 'memory', autocapture: false });
    clearPostHogStorage();
  }
}

function clearPostHogStorage(): void {
  try {
    for (const raw of document.cookie.split(';')) {
      const name = raw.split('=')[0].trim();
      if (!name.startsWith('ph_')) continue;
      const host = window.location.hostname;
      for (const domain of ['', `; domain=${host}`, `; domain=.${host.replace(/^www\./, '')}`]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('ph_')) localStorage.removeItem(key);
    }
  } catch {
    // noop
  }
}
