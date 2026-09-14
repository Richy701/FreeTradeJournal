import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useStreamingAI } from './use-streaming-ai';
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ isDemo: false }) }));
vi.mock('@/lib/firebase-lazy', () => ({ getFirebaseAuth: async () => ({ currentUser: { getIdToken: async () => 'test-token' } }) }));
let root: Root;
let hook: ReturnType<typeof useStreamingAI>;
function Probe() { hook = useStreamingAI(); return null; }
async function mount(events: unknown[]) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  root = createRoot(document.createElement('div'));
  let read = false;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, body: { getReader: () => ({ read: async () => {
    if (read) return { done: true };
    read = true;
    return { done: false, value: new TextEncoder().encode(events.map(event => `data: ${JSON.stringify(event)}\n`).join('')) };
  } }) } })));
  await act(async () => root.render(<Probe />));
}
afterEach(() => { act(() => root?.unmount()); vi.unstubAllGlobals(); });
it('records a completed non-empty response', async () => {
  await mount([{ text: 'Review your risk.' }, { done: true, usage: {} }]);
  const complete = vi.fn();
  await act(async () => { await hook.startStream('assist', { type: 'coach_chat' }, complete); });
  expect(complete).toHaveBeenCalledOnce();
});
it.each([[{ text: 'Partial reply' }], [{ done: true, usage: {} }], [{ text: '  ' }, { done: true, usage: {} }]])('does not complete for a truncated or empty reply (%j)', async (...events) => {
  await mount(events);
  const complete = vi.fn();
  await act(async () => { await hook.startStream('assist', {}, complete); });
  expect(complete).not.toHaveBeenCalled();
});
it('does not complete on a server error', async () => {
  await mount([{ text: 'Partial' }, { error: 'Failed' }]);
  const complete = vi.fn();
  await act(async () => { await expect(hook.startStream('assist', {}, complete)).rejects.toThrow('Failed'); });
  expect(complete).not.toHaveBeenCalled();
});
it('does not complete on an aborted request', async () => {
  await mount([]);
  vi.stubGlobal('fetch', vi.fn(async () => { hook.abort(); throw new DOMException('Aborted', 'AbortError'); }));
  const complete = vi.fn();
  await act(async () => { await hook.startStream('assist', {}, complete); });
  expect(complete).not.toHaveBeenCalled();
});
