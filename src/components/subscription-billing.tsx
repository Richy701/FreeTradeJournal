import { useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { SubscriptionInfo } from '@/types/subscription';

export function needsBillingRecovery(subscription: SubscriptionInfo | null): boolean {
  return !!subscription?.stripeCustomerId && subscription.planType !== 'lifetime'
    && ['past_due', 'unpaid', 'paused'].includes(subscription.status);
}

/** Billing access follows the customer relationship, not the Pro entitlement. */
export function SubscriptionBilling({ subscription, isDemo = false }: {
  subscription: SubscriptionInfo | null;
  isDemo?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const opening = useRef(false);
  if (isDemo || !subscription?.stripeCustomerId) return null;
  const recovery = needsBillingRecovery(subscription);
  const openPortal = async () => {
    if (opening.current) return;
    opening.current = true;
    setLoading(true);
    try {
      const { redirectToPortal } = await import('@/lib/stripe');
      await redirectToPortal();
      // Keep the button disabled while the browser follows the redirect.
    } catch {
      toast.error('Could not open billing. Please try again.');
      opening.current = false;
      setLoading(false);
    }
  };
  return (
    <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">Billing</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {recovery ? 'Review your subscription and payment details in secure billing.' : 'Update your card, download invoices, or cancel'}
        </p>
      </div>
      <div className="shrink-0 sm:max-w-[60%]">
        <Button variant="outline" size="sm" disabled={loading} onClick={openPortal}>
          {loading ? <><CircleNotch className="h-4 w-4 animate-spin" /> Opening…</> : recovery ? 'Manage billing' : 'Manage subscription'}
        </Button>
      </div>
    </div>
  );
}
