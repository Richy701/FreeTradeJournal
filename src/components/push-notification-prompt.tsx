import { useState, useEffect, type ReactNode } from 'react';
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

  // Rendered inside a Settings card: every state is one row, label and
  // description on the left, the control on the right.
  const Row = ({ label, description, children }: { label: string; description: string; children?: ReactNode }) => (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );

  if (checking) {
    return <Row label="Streak reminders" description="Checking notification status…" />;
  }

  if (isDemo || !user || !supported) {
    return (
      <Row
        label="Streak reminders"
        description={isDemo || !user
          ? 'Sign in to turn on streak reminders.'
          : 'This browser does not support push notifications. On iPhone, add the app to your Home Screen first.'}
      />
    );
  }

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
      <Row label="Streak reminders" description="On. You will get a daily reminder to log your trades.">
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={loading}>
          {loading ? <SpinnerGap className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BellSlash className="mr-1.5 h-3.5 w-3.5" />}
          Turn off
        </Button>
      </Row>
    );
  }

  return (
    <Row label="Streak reminders" description="A daily reminder to log your trades so you never break your streak.">
      <Button size="sm" onClick={handleEnable} disabled={loading}>
        {loading ? <SpinnerGap className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Bell className="mr-1.5 h-3.5 w-3.5" />}
        Turn on
      </Button>
    </Row>
  );
}
