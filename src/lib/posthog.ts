import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initPostHog() {
  if (!key || typeof window === 'undefined') return;

  const consent = localStorage.getItem('cookieConsent');
  const analyticsAllowed = consent ? JSON.parse(consent).analytics === true : false;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // we handle this manually on route changes
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
