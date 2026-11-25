// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionBilling, needsBillingRecovery } from './subscription-billing';
import type { SubscriptionInfo } from '@/types/subscription';

const state = vi.hoisted(() => ({ portal: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/stripe', () => ({ redirectToPortal: state.portal }));
vi.mock('sonner', () => ({ toast: { error: state.error } }));
const subscription: SubscriptionInfo = {
  status: 'past_due', planType: 'monthly', stripeCustomerId: 'cus_test',
  stripeSubscriptionId: 'sub_test', currentPeriodEnd: null, createdAt: '', updatedAt: '',
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  state.portal.mockReset().mockResolvedValue(undefined);
  state.error.mockReset();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (sub: SubscriptionInfo | null, isDemo = false) => act(() => root.render(<SubscriptionBilling subscription={sub} isDemo={isDemo} />));

describe('billing remains accessible after Pro lapses', () => {
  it.each(['past_due', 'unpaid', 'paused', 'active', 'cancelled', 'expired', 'on_trial'] as const)('opens existing billing for %s', async status => {
    render({ ...subscription, status });
    expect(container.querySelector('button')).not.toBeNull();
    await act(async () => container.querySelector('button')!.click());
    expect(state.portal).toHaveBeenCalledOnce();
  });
  it('does not offer billing without a customer or in demo', () => {
    render(null);
    expect(container.querySelector('button')).toBeNull();
    render({ ...subscription, stripeCustomerId: null });
    expect(container.querySelector('button')).toBeNull();
    render(subscription, true);
    expect(container.querySelector('button')).toBeNull();
  });
  it('prevents duplicate portal opens while pending and permits retry after failure', async () => {
    let reject!: (error: Error) => void;
    state.portal.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    render(subscription);
    await act(async () => {
      container.querySelector('button')!.click();
      container.querySelector('button')!.click();
    });
    expect(state.portal).toHaveBeenCalledOnce();
    expect(container.querySelector('button')!.disabled).toBe(true);
    await act(async () => reject(new Error('portal unavailable')));
    expect(state.error).toHaveBeenCalledOnce();
    expect(container.querySelector('button')!.disabled).toBe(false);
    await act(async () => container.querySelector('button')!.click());
    expect(state.portal).toHaveBeenCalledTimes(2);
  });
  it('reserves recovery copy for unresolved recurring billing', () => {
    expect(needsBillingRecovery(subscription)).toBe(true);
    expect(needsBillingRecovery({ ...subscription, planType: 'lifetime' })).toBe(false);
    expect(needsBillingRecovery({ ...subscription, status: 'cancelled' })).toBe(false);
    expect(needsBillingRecovery(null)).toBe(false);
  });
});
