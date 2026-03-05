export interface SubscriptionInfo {
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'on_trial' | 'unpaid';
  planType: 'monthly' | 'yearly' | 'lifetime';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProStatus {
  isPro: boolean;
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
}

export interface PricingPlan {
  name: string;
  interval: 'monthly' | 'yearly' | 'lifetime';
  price: number;
  priceId: string;
  features: string[];
}
