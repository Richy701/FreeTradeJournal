// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalysisUpgradeOffer } from './analysis-upgrade-offer';
import { ProGate } from './pro-gate';

const state = vi.hoisted(() => ({
  auth: { user: { uid: 'returning', metadata: { creationTime: '2025-01-01' } }, isDemo: false, hadSession: true },
  pro: { isPro: false, isLoading: false, hasAIAccess: false, freeAiQuota: { remaining: 0, limit: 5 } },
  track: vi.fn(),
}));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => state.auth }));
vi.mock('@/contexts/pro-context', () => ({ useProStatus: () => state.pro }));
vi.mock('@/lib/analytics', () => ({ trackEvent: state.track }));
vi.mock('@/lib/track-activity', () => ({ trackGateHit: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
let visible: () => void;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      visible = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {} disconnect() {}
  });
  localStorage.clear();
  state.auth.user = { uid: 'returning', metadata: { creationTime: '2025-01-01' } };
  state.auth.isDemo = false;
  state.auth.hadSession = true;
  state.pro.isPro = false;
  state.pro.isLoading = false;
  state.track.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function renderOffer(count = 10) {
  act(() => root.render(<MemoryRouter><AnalysisUpgradeOffer tradeCount={count} /></MemoryRouter>));
}

describe('post-analysis annual offer', () => {
  it('shows full annual billing, links to the selected plans, and counts visibility once', () => {
    renderOffer();
    expect(container.textContent).toContain('$99.99');
    expect(container.textContent).toContain('Billed annually');
    expect(container.querySelectorAll('a')[0].getAttribute('href')).toBe('/pricing?plan=yearly&source=analysis_annual_v1');
    expect(container.querySelectorAll('a')[1].getAttribute('href')).toBe('/pricing?plan=monthly&source=analysis_annual_v1');
    expect(state.track).not.toHaveBeenCalled();
    act(() => { visible(); visible(); });
    expect(state.track.mock.calls.filter(([event]) => event === 'analysis_upgrade_offer_shown')).toHaveLength(1);
  });

  it.each(['pro', 'demo', 'loading', 'new', 'first_session', 'under_ten'] as const)('excludes %s users', condition => {
    if (condition === 'pro') state.pro.isPro = true;
    if (condition === 'demo') state.auth.isDemo = true;
    if (condition === 'loading') state.pro.isLoading = true;
    if (condition === 'new') state.auth.user.metadata.creationTime = new Date().toISOString();
    if (condition === 'first_session') state.auth.hadSession = false;
    renderOffer(condition === 'under_ten' ? 9 : 10);
    expect(container.querySelector('aside')).toBeNull();
    expect(state.track).not.toHaveBeenCalled();
  });

  it('persists dismissal for this user without dismissing it for another account', () => {
    renderOffer();
    act(() => container.querySelector('button')!.click());
    expect(container.querySelector('aside')).toBeNull();
    act(() => root.render(<div />));
    renderOffer();
    expect(container.querySelector('aside')).toBeNull();
    state.auth.user = { ...state.auth.user, uid: 'another' };
    renderOffer();
    expect(container.querySelector('aside')).not.toBeNull();
  });

  it('allows the offer again after the 30-day dismissal expires', () => {
    localStorage.setItem('user_returning_analysis_annual_v1_dismissed', String(Date.now() - 31 * 86_400_000));
    renderOffer();
    expect(container.querySelector('aside')).not.toBeNull();
  });

  it('keeps a completed AI result readable at zero quota while gating a new run', () => {
    act(() => root.render(<MemoryRouter><ProGate featureName="AI Trade Analysis" completedAIResult><p>Completed analysis</p></ProGate></MemoryRouter>));
    expect(container.textContent).toBe('Completed analysis');
    act(() => root.render(<MemoryRouter><ProGate featureName="AI Trade Analysis"><p>New analysis</p></ProGate></MemoryRouter>));
    expect(container.textContent).toContain('Get Unlimited AI');
  });
});
