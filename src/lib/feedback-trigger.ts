const FEEDBACK_EVENT = 'ftj:open-feedback';

export function triggerFeedbackDialog(context?: string) {
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { context } }));
}

export function onFeedbackTrigger(handler: (context?: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent).detail?.context);
  window.addEventListener(FEEDBACK_EVENT, listener);
  return () => window.removeEventListener(FEEDBACK_EVENT, listener);
}
