import { useState, useEffect } from 'react';
import { Bell, BellSlash, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { isPushSupported, subscribeToPush, getExistingSubscription } from '@/lib/push-notifications';
import { toast } from 'sonner';

export function PushNotificationPrompt() {
  const { user, isDemo } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const isSupported = isPushSupported();
      setSupported(isSupported);
      if (isSupported) {
        const existing = await getExistingSubscription();
        setSubscribed(!!existing);
      }
      setChecking(false);
    };
    check();
  }, []);

  if (isDemo || !user || checking || !supported) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const subscription = await subscribeToPush();
      if (!subscription) {
        toast.error('Notification permission was denied. Check your browser settings.');
        return;
      }

      // Save subscription to backend
      const { httpsCallable } = await import('firebase/functions');
      const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
      const fns = await getFirebaseFunctions();
      const saveSub = httpsCallable(fns, 'savePushSubscription');
      await saveSub({ subscription: subscription.toJSON() });

      setSubscribed(true);
      toast.success('Notifications enabled. You will receive daily trade reminders.');
    } catch (err) {
      console.error('Failed to enable push notifications:', err);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const existing = await getExistingSubscription();
      if (existing) {
        // Remove from backend
        const { httpsCallable } = await import('firebase/functions');
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
        const fns = await getFirebaseFunctions();
        const removeSub = httpsCallable(fns, 'removePushSubscription');
        await removeSub({ endpoint: existing.endpoint });

        await existing.unsubscribe();
      }

      setSubscribed(false);
      toast.success('Notifications disabled.');
    } catch (err) {
      console.error('Failed to disable push notifications:', err);
      toast.error('Failed to disable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Bell className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Notifications enabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You will receive daily reminders to log your trades.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisable}
          disabled={loading}
          className="h-7 text-xs"
        >
          {loading ? (
            <SpinnerGap className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <BellSlash className="mr-1.5 h-3 w-3" />
          )}
          Disable notifications
        </Button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Bell className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Get streak reminders</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We'll remind you to log your trades so you never break your streak.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleEnable}
        disabled={loading}
        className="h-7 text-xs"
      >
        {loading ? (
          <SpinnerGap className="mr-1.5 h-3 w-3 animate-spin" />
        ) : (
          <Bell className="mr-1.5 h-3 w-3" />
        )}
        Enable notifications
      </Button>
    </div>
  );
}
