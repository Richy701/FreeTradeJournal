// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

const sendFeedback = vi.fn().mockResolvedValue({ data: { ok: true } });
vi.mock('firebase/functions', () => ({
  getFunctions: () => ({}),
  httpsCallable: () => (payload: unknown) => sendFeedback(payload),
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { uid: 'u1', metadata: { creationTime: new Date(Date.now() - 30 * 86400000).toISOString() } }, isDemo: false }),
}));
vi.mock('@/contexts/theme-presets', () => ({
  useThemePresets: () => ({ themeColors: { primary: '#f59e0b', primaryButtonText: '#000' }, alpha: () => '#0000' }),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: () => {} }));
vi.mock('@/lib/feedback-trigger', () => ({ triggerTestimonialDialog: () => {} }));

import { SatisfactionPulse } from './satisfaction-pulse';

let root: Root | null = null;
let container: HTMLDivElement | null = null;
beforeAll(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; vi.useFakeTimers(); });
beforeEach(() => { localStorage.clear(); sendFeedback.mockClear(); });
afterEach(() => { if (root) act(() => root!.unmount()); container?.remove(); root = null; container = null; });

async function mount() {
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(<SatisfactionPulse tradeCount={10} />); });
  await act(async () => { vi.advanceTimersByTime(6000); });
}
const button = (label: string) => [...container!.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;

describe('SatisfactionPulse', () => {
  it('asks why for a score of 8 or less and sends score + reason together', async () => {
    await mount();
    await act(async () => { button('6').click(); });
    expect(sendFeedback).not.toHaveBeenCalled();
    const ta = container!.querySelector('textarea')!;
    expect(ta).toBeTruthy();
    expect(button('Send').disabled).toBe(true);
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(ta, 'import missed my broker');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(button('Send').disabled).toBe(false);
    await act(async () => { button('Send').click(); });
    expect(sendFeedback).toHaveBeenCalledTimes(1);
    expect(sendFeedback.mock.calls[0][0]).toMatchObject({ type: 'nps', message: 'NPS Score: 6/10\n\nimport missed my broker' });
  });

  it('still records the bare score if the user skips the reason', async () => {
    await mount();
    await act(async () => { button('7').click(); });
    await act(async () => { button('Skip').click(); });
    expect(sendFeedback).toHaveBeenCalledTimes(1);
    expect(sendFeedback.mock.calls[0][0]).toMatchObject({ message: 'NPS Score: 7/10' });
  });

  it('sends promoters straight through without a reason step', async () => {
    await mount();
    await act(async () => { button('10').click(); });
    expect(container!.querySelector('textarea')).toBeNull();
    expect(sendFeedback).toHaveBeenCalledTimes(1);
  });
});
