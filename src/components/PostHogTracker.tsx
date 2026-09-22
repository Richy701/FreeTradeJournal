import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { isAnalyticsBlocked, posthog } from '@/lib/posthog';
import { COOKIE_CONSENT_CHANGED_EVENT, analyticsConsentGiven } from '@/lib/cookie-consent';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Landing',
  '/dashboard': 'Dashboard',
  '/trades': 'Trade Log',
  '/goals': 'Goals',
  '/journal': 'Journal',
  '/ideas': 'Trade Insights',
  '/trade-ideas': 'Trade Ideas',
  '/prop-tracker': 'PropTracker',
  '/settings': 'Settings',
  '/pricing': 'Pricing',
  '/onboarding': 'Onboarding',
  '/login': 'Login',
  '/signup': 'Signup',
  '/affiliate': 'Affiliate',
  '/profile': 'Profile',
  '/day-trading-journal': 'Day Trading Journal',
  '/online-trading-journal': 'Online Trading Journal',
  '/ftmo-review': 'FTMO Review',
  '/the5ers-review': 'The5ers Review',
  '/top-one-futures-review': 'Top One Futures Review',
};

export function PostHogTracker() {
  const location = useLocation();
  const { user, loading, isDemo } = useAuth();
  const { isPro, subscription, trialEndsAt } = useProStatus();
  const sessionTracked = useRef(false);
  // Bumped when the cookie banner is answered, so a user who accepts analytics
  // after logging in is identified right away instead of on the next
  // Pro-status change (which for one payer was only after checkout).
  const [consentVersion, setConsentVersion] = useState(0);
  useEffect(() => {
    const bump = () => setConsentVersion((v) => v + 1);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, bump);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, bump);
  }, []);

  // Track session start once
  useEffect(() => {
    if (sessionTracked.current) return;
    sessionTracked.current = true;
    trackEvent('app_opened');
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (!isAnalyticsBlocked()) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
    const pageName = PAGE_NAMES[location.pathname] || location.pathname;
    trackEvent('page_viewed', { page: pageName, path: location.pathname });
  }, [location.pathname]);

  // Identify user on login (only with analytics consent), reset on logout.
  //
  // Waits for auth to resolve: on every page load user is null for a moment,
  // and calling reset() there minted a fresh anonymous id, so identify() then
  // merged that throwaway id and the visitor's real pre-signup browsing
  // (landing, pricing views, gate hits) stayed orphaned in PostHog. reset()
  // now runs only when there is an identity to drop, so logged-out visitors
  // also keep one anonymous id across visits.
  useEffect(() => {
    if (loading) return;

    if (user && !isDemo) {
      if (analyticsConsentGiven() && !isAnalyticsBlocked()) {
        posthog.identify(user.uid, {
          email: user.email ?? undefined,
          name: user.displayName ?? undefined,
          is_pro: isPro,
          // Keeps paid vs trial segmentable — without this the signup-trial
          // backfill flips the whole base to is_pro:true and every free/Pro
          // funnel reads as a fake conversion spike
          is_trial: !!trialEndsAt,
          plan_type: subscription?.planType ?? (trialEndsAt ? 'trial' : 'free'),
        });
      }
    } else {
      posthog.resetIfIdentified();
      // While in demo, every event/pageview carries demo_session so demo
      // traffic is separable from ordinary anonymous traffic; cleared
      // explicitly on exit since reset() no longer runs on every load.
      if (isDemo) posthog.register({ demo_session: true });
      else posthog.unregister('demo_session');
    }
  }, [user, loading, isDemo, isPro, subscription, trialEndsAt, consentVersion]);

  return null;
}
