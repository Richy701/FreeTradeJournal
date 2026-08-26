import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { RouteSpinner } from '@/components/route-spinner';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

const Layout = lazyWithRetry(() => import('@/components/Layout'));
const PropTrackerLanding = lazyWithRetry(() => import('@/pages/PropTrackerLanding'));

// One shell for every signed-in page so the sidebar stays mounted between them.
// /prop-tracker is the only route that is also public: logged out it shows the
// marketing page, logged in it renders inside the same shell as everything else.
export function AppShell() {
  const { user, loading, isDemo } = useAuth();
  const { pathname } = useLocation();

  if (pathname === '/prop-tracker' && !user && !isDemo) {
    if (loading) return <RouteSpinner />;
    return (
      <Suspense fallback={null}>
        <PropTrackerLanding />
      </Suspense>
    );
  }

  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}
