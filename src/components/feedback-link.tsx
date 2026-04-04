import { useState } from 'react';
import { FeedbackButton } from '@/components/ui/feedback-button';

interface FeedbackLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function FeedbackLink({ children, className = '' }: FeedbackLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className={className || 'text-amber-500 hover:underline transition-colors'}
      >
        {children}
      </button>
      <FeedbackButton open={open} onOpenChange={setOpen} variant="ghost" />
    </>
  );
}
