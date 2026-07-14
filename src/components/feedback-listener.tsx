import { useState, useEffect } from 'react';
import { FeedbackButton } from '@/components/ui/feedback-button';
import { onFeedbackTrigger, triggerFeedbackDialog } from '@/lib/feedback-trigger';

// Deep-link sources (e.g. email links) → human-readable context labels
const LINK_CONTEXTS: Record<string, string> = {
  digest: 'Weekly digest email',
};

export function FeedbackListener() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string | undefined>();
  const [testimonialRating, setTestimonialRating] = useState<number | undefined>();

  useEffect(() => {
    return onFeedbackTrigger(({ context: ctx, testimonialRating: rating }) => {
      setContext(ctx);
      setTestimonialRating(rating);
      setOpen(true);
    });
  }, []);

  // ?feedback=<source> opens the dialog once, then strips the param so a
  // refresh or shared URL doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('feedback');
    if (!source) return;
    params.delete('feedback');
    const query = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
    triggerFeedbackDialog(LINK_CONTEXTS[source] || 'Email link');
  }, []);

  return (
    <FeedbackButton
      open={open}
      onOpenChange={setOpen}
      context={context}
      testimonialRating={testimonialRating}
    />
  );
}
