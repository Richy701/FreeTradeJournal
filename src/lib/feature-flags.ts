import { useEffect, useState } from 'react';
import { posthog, isAnalyticsBlocked } from './posthog';

/**
 * PostHog feature flags, read safely.
 *
 * Flags are evaluated through the same-origin /api/ingest proxy, which ad
 * blockers reject for a meaningful slice of users — and flags also haven't
 * loaded yet during the first render. Both cases return `undefined` from
 * posthog-js, so every read here takes an explicit `fallback` that decides
 * what those users see. Gate NEW/experimental UI with fallback=false; use
 * fallback=true only for kill-switches on existing features (so blocked
 * users keep the feature and only flagged-off users lose it).
 *
 * Reading a flag automatically emits `$feature_flag_called`, which is what
 * populates PostHog's Web Analytics "Flags" tile and experiment results.
 */
export function featureEnabled(flag: string, fallback = false): boolean {
  if (isAnalyticsBlocked()) return fallback;
  try {
    const value = posthog.isFeatureEnabled(flag);
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

/** Multivariate flag variant key, or `fallback` when unavailable. */
export function featureVariant(flag: string, fallback?: string): string | undefined {
  if (isAnalyticsBlocked()) return fallback;
  try {
    const value = posthog.getFeatureFlag(flag);
    return typeof value === 'string' ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reactive flag read for components. Starts at `fallback`, updates when
 * flags load (and on any later flag refresh, e.g. after identify()).
 */
export function useFeature(flag: string, fallback = false): boolean {
  const [enabled, setEnabled] = useState(() => featureEnabled(flag, fallback));

  useEffect(() => {
    setEnabled(featureEnabled(flag, fallback));
    return posthog.onFeatureFlags(() => setEnabled(featureEnabled(flag, fallback)));
  }, [flag, fallback]);

  return enabled;
}

/**
 * All currently-active flag values (name → variant/boolean), for annotating
 * events sent to other analytics destinations (e.g. Vercel Web Analytics'
 * Flags panel). Undefined when none are active or flags are unavailable.
 */
export function activeFlagValues(): Record<string, string | boolean> | undefined {
  if (isAnalyticsBlocked()) return undefined;
  try {
    const variants = posthog.featureFlags.getFlagVariants();
    return Object.keys(variants).length ? variants : undefined;
  } catch {
    return undefined;
  }
}

/** Reactive multivariate variant for components. */
export function useFeatureVariant(flag: string, fallback?: string): string | undefined {
  const [variant, setVariant] = useState(() => featureVariant(flag, fallback));

  useEffect(() => {
    setVariant(featureVariant(flag, fallback));
    return posthog.onFeatureFlags(() => setVariant(featureVariant(flag, fallback)));
  }, [flag, fallback]);

  return variant;
}
