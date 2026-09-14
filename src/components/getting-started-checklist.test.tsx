import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { GettingStartedChecklist } from './getting-started-checklist';
import { markCoachCompleted, hasCompletedCoach } from '@/lib/coach-completion';
vi.mock('@/contexts/auth-context', () => { const auth = { user: { uid: 'trader' }, isDemo: false }; return { useAuth: () => auth }; });
vi.mock('@/contexts/pro-context', () => { const pro = { isPro: false, hasAIAccess: true, freeAiQuota: { limit: 5 } }; return { useProStatus: () => pro }; });
// Stable context values prevent unrelated mock-induced render loops.
vi.mock('@/utils/user-storage', () => {
  const storage = { getItem: (key: string) => localStorage.getItem(`user_trader_${key}`) };
  return { useUserStorage: () => storage, UserStorage: {
    getItem: (uid: string, key: string) => localStorage.getItem(`user_${uid}_${key}`),
    setItem: (uid: string, key: string, value: string) => localStorage.setItem(`user_${uid}_${key}`, value),
  } };
});
it('links to Coach and updates progress after success without reloading or sharing progress', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><GettingStartedChecklist /></MemoryRouter>));
    expect(container.querySelector('a[href="/coach"]')?.textContent).toContain('Ask Coach FTJ');
    expect(container.textContent).toContain('1/5 done');
    await act(async () => markCoachCompleted('trader'));
    expect(container.textContent).toContain('2/5 done');
    localStorage.removeItem('user_trader_ftj-coach-chat-history');
    expect(hasCompletedCoach('trader')).toBe(true);
    expect(hasCompletedCoach('other')).toBe(false);
  } finally { act(() => root.unmount()); localStorage.clear(); }
});
