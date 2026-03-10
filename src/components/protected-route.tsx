import { useAuth } from '@/contexts/auth-context';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { hasCompletedOnboarding } from '@/utils/onboarding';
import { UserStorage } from '@/utils/user-storage';
import { useAutoRestore } from '@/hooks/use-auto-restore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isDemo } = useAuth();
  const location = useLocation();
  const { isRestoring, restoreComplete } = useAutoRestore();

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Wait for auto-restore to complete for Pro users
  if (!isDemo && user && (isRestoring || !restoreComplete)) {
    return <LoadingSkeleton />;
  }

  // Allow demo users through without authentication
  if (!user && !isDemo) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Skip onboarding check for demo users
  if (!isDemo) {
    const userId = user?.uid || null;
    const hasOnboarding = hasCompletedOnboarding(userId);

    // Additional check: if user has data (accounts/trades), skip onboarding even if flag is missing
    const hasData = userId && (
      UserStorage.getItem(userId, 'accounts') !== null ||
      UserStorage.getItem(userId, 'trades') !== null
    );

    // If user is authenticated but hasn't completed onboarding AND has no data, redirect to onboarding
    // Exception: if they're already on the onboarding page, let them through
    if (!hasOnboarding && !hasData && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}