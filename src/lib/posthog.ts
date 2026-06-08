import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = 'https://eu.i.posthog.com';

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
  });
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
