// @vitest-environment jsdom
// Regression test: a fresh Google sign-up must land on /onboarding, not be
// bounced to /dashboard by the "already signed in" redirect effect firing
// after the handler's setGoogleLoading(false).
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

let setAuthUser: (u: any) => void = () => {};
const signInWithGoogle = vi.fn(async () => {
  const user = { uid: 'new-google-user', emailVerified: true };
  setAuthUser(user);
  return { user, isNewUser: true };
});
const signIn = vi.fn(async () => {
  setAuthUser({ uid: 'returning-user', emailVerified: true });
});
const signUp = vi.fn();

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => {
    const [user, setUser] = useState<any>(null);
    setAuthUser = setUser;
    return { user, isDemo: false, loading: false, signIn, signUp, signInWithGoogle };
  },
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/utils/onboarding', () => ({ clearOnboardingData: vi.fn() }));
vi.mock('@/lib/firebase-lazy', () => ({ getFirebaseAuth: vi.fn(async () => ({})) }));
vi.mock('firebase/auth', () => ({}));

import Signup from './Signup';
import Login from './Login';

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as any);
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
afterEach(() => {
  act(() => { root?.unmount(); });
  root = null;
  container?.remove();
  container = null;
  vi.clearAllMocks();
});

function mount(path: string) {
  window.history.replaceState({}, '', path);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<div data-testid="onboarding">onboarding</div>} />
          <Route path="/dashboard" element={<div data-testid="dashboard">dashboard</div>} />
        </Routes>
      </BrowserRouter>
    );
  });
}

async function clickGoogle() {
  const btn = Array.from(container!.querySelectorAll('button')).find(b => /google/i.test(b.textContent || ''));
  expect(btn, 'Google button present').toBeTruthy();
  await act(async () => { btn!.click(); });
  // Let the handler's finally{} state update and any queued navigation settle.
  await act(async () => { await new Promise(r => setTimeout(r, 50)); });
}

describe('fresh Google sign-up lands on onboarding', () => {
  it('Signup page', async () => {
    mount('/signup');
    await clickGoogle();
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/onboarding');
    expect(container!.querySelector('[data-testid="onboarding"]')).toBeTruthy();
  });

  it('Login page', async () => {
    mount('/login');
    await clickGoogle();
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/onboarding');
  });

  it('a visitor who is already signed in still skips the form', async () => {
    mount('/signup');
    await act(async () => { setAuthUser({ uid: 'existing', emailVerified: true }); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(window.location.pathname).toBe('/dashboard');
  });
});
