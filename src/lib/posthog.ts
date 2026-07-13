import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = '/api/ingest';

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

export function initPostHog() {
  if (!key || typeof window === 'undefined') return;

  const consent = localStorage.getItem('cookieConsent');
  const analyticsAllowed = consent ? JSON.parse(consent).analytics === true : false;

  posthog.init(key, {
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

  detectBlocking();
}

// Ad blockers (uBlock / EasyPrivacy) reject the entire /api/ingest path
// regardless of the same-origin proxy. One HEAD probe; if it's rejected we stop
// client capture so the SDK doesn't retry every blocked event into a wall.
function detectBlocking(): void {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  fetch(`${host}/i/v0/e/`, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    .catch(() => {
      blocked = true;
      try {
        posthog.set_config({ autocapture: false, capture_pageleave: false, capture_exceptions: false });
      } catch {
        // noop
      }
    })
    .finally(() => clearTimeout(timer));
}

export function updatePostHogConsent(analyticsAllowed: boolean) {
  if (!posthog.__loaded) return;

  if (analyticsAllowed) {
    posthog.set_config({ persistence: 'localStorage+cookie', autocapture: true });
  } else {
    posthog.set_config({ persistence: 'memory', autocapture: false });
  }
}

export { posthog };
