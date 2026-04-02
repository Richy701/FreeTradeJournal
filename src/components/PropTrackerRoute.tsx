import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

const PropTracker = lazy(() => import('@/pages/PropTracker'));
const PropTrackerLanding = lazy(() => import('@/pages/PropTrackerLanding'));

export function PropTrackerRoute() {
  const { user, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
