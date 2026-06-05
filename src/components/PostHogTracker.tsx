import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';

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
};

export function PostHogTracker() {
  const posthog = usePostHog();
  const location = useLocation();
  const { user, isDemo } = useAuth();
  const { isPro, subscription } = useProStatus();
  const sessionTracked = useRef(false);

  // Track session start once
  useEffect(() => {
    if (sessionTracked.current) return;
    sessionTracked.current = true;
    trackEvent('app_opened');
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
    const pageName = PAGE_NAMES[location.pathname] || location.pathname;
    trackEvent('page_viewed', { page: pageName, path: location.pathname });
  }, [location.pathname, posthog]);

  // Identify user on login, reset on logout; set pro segmentation properties
  useEffect(() => {
    if (!posthog) return;

    if (user && !isDemo) {
      posthog.identify(user.uid, {
        email: user.email ?? undefined,
        name: user.displayName ?? undefined,
        is_pro: isPro,
        plan_type: subscription?.planType ?? 'free',
      });
    } else {
      posthog.reset();
    }
  }, [user, isDemo, posthog, isPro, subscription]);

  return null;
}
