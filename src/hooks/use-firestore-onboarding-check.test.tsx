import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useFirestoreOnboardingCheck } from './use-firestore-onboarding-check';

const getDoc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/firebase-lazy', () => ({ getFirebaseFirestore: async () => ({}) }));
vi.mock('firebase/firestore', () => ({ doc: (_db: unknown, _path: string, uid: string) => uid, getDoc }));
let root: Root;
let container: HTMLDivElement;
let latest: ReturnType<typeof useFirestoreOnboardingCheck>;
function Probe({ uid, skip }: { uid: string; skip: boolean }) {
  latest = useFirestoreOnboardingCheck(uid, skip);
  return null;
}
function mount() {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  root = createRoot(container);
}
afterEach(() => { act(() => root?.unmount()); localStorage.clear(); vi.clearAllMocks(); });
it('waits immediately when restore finishes, and scopes completion to the current user', async () => {
  mount();
  let resolve!: (value: unknown) => void;
  getDoc.mockImplementation(() => new Promise(r => { resolve = r; }));
  await act(async () => { root.render(<Probe uid="first" skip />); });
  await act(async () => { root.render(<Probe uid="first" skip={false} />); });
  expect(latest.checking).toBe(true);
  await act(async () => { resolve({ exists: () => true, data: () => ({ onboardingCompleted: true }) }); });
  expect(localStorage.getItem('user_first_onboardingCompleted')).toBe('true');
  await act(async () => { root.render(<Probe uid="second" skip={false} />); });
  expect(latest).toEqual({ checking: true, completedInFirestore: false });
  await act(async () => { resolve({ exists: () => false }); });
  expect(latest).toEqual({ checking: false, completedInFirestore: false });
});
it('avoids re-onboarding on lookup failure without storing a false completion flag', async () => {
  mount(); getDoc.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { root.render(<Probe uid="returning" skip={false} />); });
  expect(latest).toEqual({ checking: false, completedInFirestore: true });
  expect(localStorage.getItem('user_returning_onboardingCompleted')).toBeNull();
});
