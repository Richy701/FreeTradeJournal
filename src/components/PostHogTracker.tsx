import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { isAnalyticsBlocked } from '@/lib/posthog';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Landing',
  '/dashboard': 'Dashboard',
  '/trades': 'Trade Log',
  '/goals': 'Goals',
  '/journal': 'Journal',
  '/ideas': 'Trade Insights',
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
  const posthog = usePostHog();
  const location = useLocation();
  const { user, isDemo } = useAuth();
  const { isPro, subscription, trialEndsAt } = useProStatus();
  const sessionTracked = useRef(false);

  // Track session start once
  useEffect(() => {
    if (sessionTracked.current) return;
    sessionTracked.current = true;
    trackEvent('app_opened');
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (posthog && !isAnalyticsBlocked()) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
    const pageName = PAGE_NAMES[location.pathname] || location.pathname;
    trackEvent('page_viewed', { page: pageName, path: location.pathname });
  }, [location.pathname, posthog]);

  // Identify user on login (only with analytics consent), reset on logout
  useEffect(() => {
    if (!posthog) return;

    if (user && !isDemo) {
      const consent = localStorage.getItem('cookieConsent');
      const analyticsAllowed = consent ? JSON.parse(consent).analytics === true : false;

      if (analyticsAllowed && !isAnalyticsBlocked()) {
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
      posthog.reset();
    }
  }, [user, isDemo, posthog, isPro, subscription, trialEndsAt]);

  return null;
}
