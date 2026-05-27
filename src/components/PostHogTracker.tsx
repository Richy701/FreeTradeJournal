import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from '@/contexts/auth-context';

export function PostHogTracker() {
  const posthog = usePostHog();
  const location = useLocation();
  const { user, isDemo } = useAuth();

  // Track pageviews on route change
  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
  }, [location.pathname, posthog]);

  // Identify user on login, reset on logout
  useEffect(() => {
    if (!posthog) return;

    if (user && !isDemo) {
      posthog.identify(user.uid, {
        email: user.email ?? undefined,
        name: user.displayName ?? undefined,
      });
    } else {
      posthog.reset();
    }
  }, [user, isDemo, posthog]);

  return null;
}
