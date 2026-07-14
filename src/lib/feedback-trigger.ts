const FEEDBACK_EVENT = 'ftj:open-feedback';

export interface FeedbackTriggerDetail {
  context?: string;
  /** When set, the dialog opens directly on the testimonial step with this star rating. */
  testimonialRating?: number;
}

export function triggerFeedbackDialog(context?: string) {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { context } }));
}

export function triggerTestimonialDialog(rating: number, context?: string) {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { context, testimonialRating: rating } }));
}

export function onFeedbackTrigger(handler: (detail: FeedbackTriggerDetail) => void) {
  const listener = (e: Event) => handler((e as CustomEvent).detail ?? {});
  window.addEventListener(FEEDBACK_EVENT, listener);
  return () => window.removeEventListener(FEEDBACK_EVENT, listener);
}
