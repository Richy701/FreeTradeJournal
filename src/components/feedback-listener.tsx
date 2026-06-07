import { useState, useEffect } from 'react';
import { FeedbackButton } from '@/components/ui/feedback-button';
import { onFeedbackTrigger } from '@/lib/feedback-trigger';

export function FeedbackListener() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<string | undefined>();

  useEffect(() => {
    return onFeedbackTrigger((ctx) => {
      setContext(ctx);
      setOpen(true);
    });
  }, []);

  return (
    <FeedbackButton
      open={open}
      onOpenChange={setOpen}
      context={context}
    />
  );
}
