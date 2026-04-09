import { useAuth } from '@/contexts/auth-context';
import { Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { hasCompletedOnboarding } from '@/utils/onboarding';
import { UserStorage } from '@/utils/user-storage';
import { useAutoRestore } from '@/hooks/use-auto-restore';
import { useFirestoreOnboardingCheck } from '@/hooks/use-firestore-onboarding-check';

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
  const { isRestoring, restoreComplete, restoreFailed } = useAutoRestore();

  const userId = user?.uid || null;
  const localOnboardingDone = !isDemo && hasCompletedOnboarding(userId);

  // Only run Firestore fallback check when: user exists, not demo, local flag missing, restore not still running
  const skipFirestoreCheck = isDemo || !user || localOnboardingDone || !restoreComplete;
  const { checking: checkingFirestore, completedInFirestore } = useFirestoreOnboardingCheck(userId, skipFirestoreCheck);

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Wait for auto-restore to complete for Pro users
  if (!isDemo && user && (isRestoring || !restoreComplete)) {
    return <LoadingSkeleton />;
  }

  // Wait for Firestore fallback check if needed
  if (checkingFirestore) {
    return <LoadingSkeleton />;
  }

  // Allow demo users through without authentication
  if (!user && !isDemo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require email verification only for accounts created after verification was introduced
  const verificationCutoff = new Date('2026-04-09T00:00:00Z').getTime();
  const accountCreatedAt = user?.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
  if (!isDemo && user && !user.emailVerified && accountCreatedAt >= verificationCutoff) {
    return <Navigate to="/verify-email" replace />;
  }

  // Skip onboarding check for demo users
  if (!isDemo) {
    const hasOnboarding = localOnboardingDone || completedInFirestore;

    // Additional check: if user has data (accounts/trades), skip onboarding even if flag is missing
    const hasData = userId && (
      UserStorage.getItem(userId, 'accounts') !== null ||
      UserStorage.getItem(userId, 'trades') !== null
    );

    // If restore failed, be conservative — don't re-onboard a returning user whose restore just errored
    const safeToRedirect = !restoreFailed;

    if (!hasOnboarding && !hasData && safeToRedirect && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}