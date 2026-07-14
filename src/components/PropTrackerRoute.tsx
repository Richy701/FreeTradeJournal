import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { RouteSpinner } from '@/components/ui/route-spinner';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

const Layout = lazyWithRetry(() => import('@/components/Layout'));
const PropTracker = lazy(() => import('@/pages/PropTracker'));
const PropTrackerLanding = lazy(() => import('@/pages/PropTrackerLanding'));

export function PropTrackerRoute() {
  const { user, loading, isDemo } = useAuth();

  if (loading) {
    return <RouteSpinner />;
  }

  if (!user && !isDemo) {
    return (
      <Suspense fallback={null}>
        <PropTrackerLanding />
      </Suspense>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={null}>
          <PropTracker />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}
