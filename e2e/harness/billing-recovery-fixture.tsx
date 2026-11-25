// Local test fixture only; no account is loaded and Stripe is mocked by the harness.
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { SubscriptionBilling } from '@/components/subscription-billing';
import type { SubscriptionInfo } from '@/types/subscription';
import '@/index.css';

const subscription: SubscriptionInfo = {
  status: 'past_due', planType: 'monthly', stripeCustomerId: 'cus_test',
  stripeSubscriptionId: 'sub_test', currentPeriodEnd: null, createdAt: '', updatedAt: '',
};
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-2xl p-5 space-y-5">
    {(['past_due', 'active', 'cancelled'] as const).map(status => (
      <section key={status} aria-label={status} className="rounded-xl border border-border/70 bg-card divide-y divide-border/50 overflow-hidden">
        <SubscriptionBilling subscription={{ ...subscription, status }} />
      </section>
    ))}
    <section aria-label="never-paid"><SubscriptionBilling subscription={null} /></section>
    <section aria-label="demo"><SubscriptionBilling subscription={subscription} isDemo /></section>
    <Toaster />
  </main>,
);
