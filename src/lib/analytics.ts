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

/**
 * Track a named event in PostHog with optional properties.
 * Silently swallows errors so analytics never breaks the app.
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (isAnalyticsBlocked()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics should never break the app
  }
}