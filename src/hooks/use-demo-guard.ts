import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

/**
 * Read-only demo guard.
 *
 * Demo mode is a view-only showcase: visitors can browse every page with sample
 * data, but any action that would change data is intercepted with a single,
 * consistent sign-up prompt. Call the returned function at the top of every
 * mutation handler:
 *
 *   const demoGuard = useDemoGuard();
 *   const handleSave = () => {
 *     if (demoGuard('save your trades')) return;
 *     ...real save...
 *   };
 *
 * Returns true (and shows the prompt) when in demo, so the caller should bail.
 * Navigation uses window.location so this works in contexts mounted outside the
 * Router (account/settings providers) as well as in pages.
 */
export function useDemoGuard() {
  const { isDemo, exitDemoMode } = useAuth();

  return useCallback(
    (action: string = 'do that'): boolean => {
      if (!isDemo) return false;
      // Fixed id so simultaneous guarded calls (e.g. a handler that updates both
      // settings and an account) collapse into one toast instead of stacking.
      toast.info(`This is a read-only demo. Sign up free to ${action}.`, {
        id: 'demo-readonly',
        action: {
          label: 'Sign up',
          onClick: () => {
            exitDemoMode();
            window.location.assign('/signup');
          },
        },
      });
      return true;
    },
    [isDemo, exitDemoMode]
  );
}
