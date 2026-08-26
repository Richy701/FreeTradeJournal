// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { FeedbackButton } from './feedback-button';
import { FeedbackListener } from '@/components/feedback-listener';
import { triggerTestimonialDialog, triggerFeedbackDialog, onFeedbackTrigger } from '@/lib/feedback-trigger';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { displayName: 'Test Trader' }, isDemo: false }),
}));

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  // Radix UI needs these in jsdom
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as any);
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(ui));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = null;
  container = null;
  document.body.innerHTML = '';
});

describe('feedback-trigger', () => {
  it('delivers testimonial rating and context through the event', () => {
    const seen: any[] = [];
    const off = onFeedbackTrigger((detail) => seen.push(detail));
    triggerTestimonialDialog(5, 'NPS Score: 9');
    triggerFeedbackDialog('CSV Import');
    off();
    expect(seen).toEqual([
      { context: 'NPS Score: 9', testimonialRating: 5 },
      { context: 'CSV Import' },
    ]);
  });
});

describe('FeedbackDialog testimonial handoff', () => {
  it('opens on the feedback form by default', () => {
    render(<FeedbackButton open onOpenChange={() => {}} />);
    expect(document.body.textContent).toContain('Share your feedback');
    expect(document.body.textContent).not.toContain('Would you share your story?');
  });

  it('opens directly on the testimonial step when testimonialRating is set', () => {
    render(<FeedbackButton open onOpenChange={() => {}} testimonialRating={5} context="NPS Score: 9" />);
    expect(document.body.textContent).toContain('Would you share your story?');
    expect(document.body.textContent).not.toContain('What kind of feedback is this?');
  });
});

describe('FeedbackListener email deep link', () => {
  it('opens the dialog from ?feedback=digest and strips the param', () => {
    window.history.replaceState(null, '', '/dashboard?feedback=digest');
    render(<FeedbackListener />);
    expect(document.body.textContent).toContain('Share your feedback');
    expect(document.body.textContent).toContain('Weekly digest email');
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('does not open the dialog without the param', () => {
    window.history.replaceState(null, '', '/dashboard');
    render(<FeedbackListener />);
    expect(document.body.textContent).not.toContain('Share your feedback');
  });
});
