// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Pricing from './Pricing';
import { HISTORY_UPGRADE_URL, PRICING_PLANS } from '@/constants/pricing';
import type { SubscriptionInfo } from '@/types/subscription';

const state = vi.hoisted(() => ({
  isPro: false,
  subscription: null as SubscriptionInfo | null,
  portal: vi.fn().mockResolvedValue(undefined),
  track: vi.fn(),
  checkout: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { uid: 'pricing-test' } }) }));
vi.mock('@/contexts/pro-context', () => ({
  useProStatus: () => ({ isPro: state.isPro, subscription: state.subscription, openCheckout: state.checkout }),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: state.track }));
vi.mock('@/lib/stripe', () => ({ redirectToPortal: state.portal }));
vi.mock('@/hooks/use-sale-clock', () => ({ useSaleClock: () => Date.parse('2026-12-02T12:00:00Z') }));
vi.mock('@/components/marketing-header', () => ({ MarketingHeader: () => null }));
vi.mock('@/components/blocks/shape-landing-hero', () => ({ GeometricBackdrop: () => null }));
vi.mock('@/components/blocks/footer-7', () => ({ Footer7: () => null }));
vi.mock('@/components/blocks/testimonials-section', () => ({ TestimonialsSection: () => null }));
vi.mock('@/components/seo-meta', () => ({ SEOMeta: () => null }));
vi.mock('@number-flow/react', () => ({ default: ({ value }: { value: number }) => <span>{value}</span> }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.isPro = false;
  state.subscription = null;
  state.portal.mockClear();
  state.track.mockClear();
  state.checkout.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function renderPricing(url: string) {
  act(() => root.render(<MemoryRouter initialEntries={[url]}><Pricing /></MemoryRouter>));
}

describe('full-history pricing pilot', () => {
  it.each(['past_due', 'unpaid', 'paused'] as const)('routes %s subscribers to existing billing, not checkout', async status => {
    state.subscription = { status, planType: 'monthly', stripeCustomerId: 'cus_test', stripeSubscriptionId: 'sub_test', currentPeriodEnd: null, createdAt: '', updatedAt: '' };
    renderPricing('/pricing');
    const manage = [...container.querySelectorAll('button')].find(button => button.textContent === 'Manage billing')!;
    expect(manage).toBeDefined();
    await act(async () => manage.click());
    expect(state.portal).toHaveBeenCalledOnce();
    expect(state.checkout).not.toHaveBeenCalled();
  });
  it('opens on monthly, preserves free access and attributes the checkout', async () => {
    renderPricing(HISTORY_UPGRADE_URL);
    expect(container.querySelector('h1')?.textContent).toContain('Review beyond the last 30 days.');
    expect(container.textContent).toContain('Your complete trade log and exports stay free.');
    expect(container.querySelector('a[href="/dashboard"]')?.textContent).toContain('Continue with Free');
    expect(container.querySelector('[role="tab"][data-state="active"]')?.textContent).toBe('monthly');
    expect(state.track).toHaveBeenCalledWith('pricing_viewed', expect.objectContaining({ offer_source: 'history_review_v1' }));
    const buy = [...container.querySelectorAll('button')].find(button => button.textContent === 'Get Pro')!;
    await act(async () => buy.click());
    expect(state.checkout).toHaveBeenCalledWith(PRICING_PLANS.find(plan => plan.interval === 'monthly')!.priceId);
    expect(state.track).toHaveBeenCalledWith('checkout_started', expect.objectContaining({ plan: 'monthly', offer_source: 'history_review_v1' }));
  });

  it('keeps annual-offer selection and attribution intact', () => {
    renderPricing('/pricing?plan=yearly&source=analysis_annual_v1');
    expect(container.querySelector('h1')?.textContent).toContain('Start with your trades.');
    expect(container.querySelector('[role="tab"][data-state="active"]')?.textContent).toContain('yearly');
    expect(state.track).toHaveBeenCalledWith('pricing_viewed', expect.objectContaining({ offer_source: 'analysis_annual_v1' }));
  });

  it.each(['/pricing', '/pricing?source=unrecognised'])('keeps normal pricing at %s', url => {
    renderPricing(url);
    expect(container.querySelector('h1')?.textContent).toContain('Start with your trades.');
    expect(container.querySelector('a[href="/dashboard"]')).toBeNull();
    expect(state.track).toHaveBeenCalledWith('pricing_viewed', { logged_in: true, is_pro: false });
  });

  it('does not tell existing Pro users to continue with Free', () => {
    state.isPro = true;
    renderPricing(HISTORY_UPGRADE_URL);
    expect(container.querySelector('h1')?.textContent).toContain('Start with your trades.');
    expect(container.querySelector('a[href="/dashboard"]')).toBeNull();
  });
});
