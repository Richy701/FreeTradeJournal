// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostHogTracker } from './PostHogTracker';
import { COOKIE_CONSENT_CHANGED_EVENT, writeCookieConsent } from '@/lib/cookie-consent';

const state = vi.hoisted(() => ({
  auth: { user: null as { uid: string; email?: string } | null, loading: true, isDemo: false },
  pro: { isPro: false, subscription: null as { planType: string } | null, trialEndsAt: null },
  posthog: {
    identify: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
    capture: vi.fn(),
    _isIdentified: vi.fn(() => false),
  },
}));
vi.mock('posthog-js/react', () => ({ usePostHog: () => state.posthog }));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => state.auth }));
vi.mock('@/contexts/pro-context', () => ({ useProStatus: () => state.pro }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/posthog', () => ({ isAnalyticsBlocked: () => false }));

let root: Root;
let container: HTMLDivElement;
const render = () => act(() => root.render(<MemoryRouter><PostHogTracker /></MemoryRouter>));

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  writeCookieConsent(true);
  state.auth.user = null;
  state.auth.loading = true;
  state.auth.isDemo = false;
  state.pro.isPro = false;
  state.pro.subscription = null;
  for (const fn of Object.values(state.posthog)) fn.mockClear();
  state.posthog._isIdentified.mockReturnValue(false);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('PostHogTracker identity', () => {
  it('never resets the anonymous id while auth is still resolving, so identify merges the real browsing history', () => {
    render();
    expect(state.posthog.reset).not.toHaveBeenCalled();

    state.auth.user = { uid: 'uid-1', email: 'a@b.c' };
    state.auth.loading = false;
    render();

    expect(state.posthog.reset).not.toHaveBeenCalled();
    expect(state.posthog.identify).toHaveBeenCalledWith('uid-1', expect.objectContaining({ email: 'a@b.c' }));
  });

  it('keeps the anonymous id across loads for logged-out visitors', () => {
    state.auth.loading = false;
    render();
    expect(state.posthog.reset).not.toHaveBeenCalled();
  });

  it('still drops the identity on logout', () => {
    state.auth.user = { uid: 'uid-1' };
    state.auth.loading = false;
    render();
    state.posthog._isIdentified.mockReturnValue(true);

    state.auth.user = null;
    render();
    expect(state.posthog.reset).toHaveBeenCalledTimes(1);
  });

  it('identifies as soon as analytics consent is granted after login', () => {
    localStorage.clear();
    state.auth.user = { uid: 'uid-1' };
    state.auth.loading = false;
    render();
    expect(state.posthog.identify).not.toHaveBeenCalled();

    act(() => {
      writeCookieConsent(true);
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT));
    });
    expect(state.posthog.identify).toHaveBeenCalledWith('uid-1', expect.anything());
  });

  it('flags demo sessions without needing a reset, and clears the flag on exit', () => {
    state.auth.loading = false;
    state.auth.isDemo = true;
    state.auth.user = { uid: 'demo' };
    render();
    expect(state.posthog.register).toHaveBeenCalledWith({ demo_session: true });
    expect(state.posthog.reset).not.toHaveBeenCalled();

    state.auth.isDemo = false;
    state.auth.user = null;
    render();
    expect(state.posthog.unregister).toHaveBeenCalledWith('demo_session');
  });
});
