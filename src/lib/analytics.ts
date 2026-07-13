// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics Configuration
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events (Google Analytics)
export const trackGAEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user interactions (Google Analytics)
export const trackUserAction = (action: string, details?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      custom_parameter: details,
    });
  }
};

// ─── PostHog Event Tracking ─────────────────────────────────
import { posthog, isAnalyticsBlocked } from './posthog';
import { track as vercelTrack } from '@vercel/analytics';
import { activeFlagValues } from './feature-flags';

// Conversion-funnel events mirrored to Vercel Web Analytics (its dashboard
// "custom events" panel). Kept to a deliberate allowlist: Vercel meters
// events per month, so high-volume product events (page_viewed,
// trade_created, AI usage) stay PostHog-only. Vercel's endpoint is
// /_vercel/insights (separate from the PostHog proxy), so this still fires
// when the PostHog probe reports blocked.
const VERCEL_MIRRORED_EVENTS = new Set([
  'signup_completed',
  'onboarding_completed',
  'csv_imported',
  'checkout_started',
  'checkout_completed',
  'checkout_cancelled',
  'checkout_failed',
  'pricing_cta_clicked',
  'pro_gate_cta_clicked',
  'exit_survey_submitted',
]);

// Vercel rejects nested property values — keep scalars only.
function scalarProps(
  properties?: Record<string, any>
): Record<string, string | number | boolean | null> | undefined {
  if (!properties) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Track a named event in PostHog with optional properties.
 * Silently swallows errors so analytics never breaks the app.
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!isAnalyticsBlocked()) {
    try {
      posthog.capture(event, properties);
    } catch {
      // Analytics should never break the app
    }
  }

  if (VERCEL_MIRRORED_EVENTS.has(event)) {
    try {
      // Annotating with active PostHog flags feeds Vercel's Flags panel, so
      // conversion events segment by experiment without extra wiring.
      vercelTrack(event, scalarProps(properties), { flags: activeFlagValues() });
    } catch {
      // Analytics should never break the app
    }
  }
}