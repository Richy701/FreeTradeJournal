// @vitest-environment jsdom
// Regression for the 2026-08-17 incident: one client sent 1,551 quota-denied
// aiAssist calls in seven seconds. The risk monitor re-ran detection on every
// cross-tab `storage` event (PostHog writes localStorage on each capture), a
// failed attempt was never remembered, and the client's quota state never
// learned about the 403 — so two tabs fed each other forever.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const requestAIAssist = vi.fn();
vi.mock('@/services/ai-assist', () => ({ requestAIAssist: (...args: unknown[]) => requestAIAssist(...args) }));

const updateFreeAiQuota = vi.fn();
vi.mock('@/contexts/pro-context', () => ({
  useProStatus: () => ({ isPro: false, hasAIAccess: true, hasAutoAIAccess: true, updateFreeAiQuota }),
}));
const user = { uid: 'u1' };
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user, isDemo: false }) }));
const getCurrencySymbol = () => '$';
vi.mock('@/contexts/settings-context', () => ({ useSettings: () => ({ getCurrencySymbol }) }));
vi.mock('@/contexts/theme-presets', () => ({
  useThemePresets: () => ({ themeColors: { loss: '#f00', primary: '#000' }, alpha: () => '#0000' }),
}));
const userStorage = { getItem: () => null, setItem: () => {} };
vi.mock('@/utils/user-storage', () => ({ useUserStorage: () => userStorage }));
vi.mock('@/components/ai-feedback', () => ({ AIFeedback: () => null }));
vi.mock('@/lib/analytics', () => ({ trackEvent: () => {} }));

// Three consecutive losses → the monitor detects a pattern and asks for advice.
const losingTrades = [1, 2, 3].map((i) => ({
  id: String(i), symbol: 'NQ', side: 'long', pnl: -50,
  entryTime: new Date(Date.now() - i * 3_600_000).toISOString(),
  exitTime: new Date(Date.now() - i * 3_600_000 + 60_000).toISOString(),
}));
// Stable identity, like the real useCallback-backed getTrades.
const getTrades = () => losingTrades;
vi.mock('@/hooks/use-demo-data', () => ({ useDemoData: () => ({ getTrades }) }));

import { AIRiskAlertMonitor } from './ai-risk-alert';
import { FREE_AI_QUOTA_EXHAUSTED_EVENT } from '@/lib/ai-quota';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeAll(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });
beforeEach(() => { localStorage.clear(); requestAIAssist.mockReset(); updateFreeAiQuota.mockReset(); });
afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove(); root = null; container = null;
});

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(<AIRiskAlertMonitor />); });
  await act(async () => { await Promise.resolve(); });
}

function otherTabWrote(key: string) {
  return act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: 'x' }));
    await Promise.resolve();
  });
}

describe('AIRiskAlertMonitor quota-denied behaviour', () => {
  it('does not retry a denied alert on unrelated cross-tab storage writes', async () => {
    const denied = Object.assign(new Error('You\'ve used all 20 free AI queries this month.'), { code: 'functions/permission-denied' });
    requestAIAssist.mockRejectedValue(denied);
    await mount();
    expect(requestAIAssist).toHaveBeenCalledTimes(1);

    // PostHog persistence writes in another tab — the trigger from the incident.
    for (let i = 0; i < 5; i++) await otherTabWrote('ph_phc_test_posthog');
    // A genuine trade write in another tab must not re-ask either: the attempt
    // for this alert type is already recorded for today.
    await otherTabWrote('user_u1_trades');

    expect(requestAIAssist).toHaveBeenCalledTimes(1);
  });

  it('tells the quota state it is exhausted when the server says so', async () => {
    const denied = Object.assign(new Error('You\'ve used all 20 free AI queries this month.'), { code: 'functions/permission-denied' });
    requestAIAssist.mockRejectedValue(denied);
    const seen = vi.fn();
    window.addEventListener(FREE_AI_QUOTA_EXHAUSTED_EVENT, seen);
    await mount();
    await act(async () => { await Promise.resolve(); });
    window.removeEventListener(FREE_AI_QUOTA_EXHAUSTED_EVENT, seen);
    expect(seen).toHaveBeenCalled();
  });

  it('still asks once per alert type when the call succeeds', async () => {
    requestAIAssist.mockResolvedValue({ result: 'Take a break.', usage: { used: 1, limit: 75, remaining: 74 } });
    await mount();
    await otherTabWrote('user_u1_trades');
    expect(requestAIAssist).toHaveBeenCalledTimes(1);
  });
});
