import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || '/ingest';

export function initPostHog() {
  if (!key || typeof window === 'undefined') return;

  const consent = localStorage.getItem('cookieConsent');
  const analyticsAllowed = consent ? JSON.parse(consent).analytics === true : false;

  posthog.init(key, {
    api_host: host,
    ui_host: 'https://us.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    persistence: analyticsAllowed ? 'localStorage+cookie' : 'memory',
    autocapture: analyticsAllowed,
    loaded: (ph) => {
      if (!analyticsAllowed) {
        ph.opt_out_capturing();
      }
    },
  });
}

export function updatePostHogConsent(analyticsAllowed: boolean) {
  if (!posthog.__loaded) return;

  if (analyticsAllowed) {
    posthog.opt_in_capturing();
    posthog.set_config({ persistence: 'localStorage+cookie', autocapture: true });
  } else {
    posthog.opt_out_capturing();
  }
}

export { posthog };
