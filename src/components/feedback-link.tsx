import { useState } from 'react';
import { FeedbackButton } from '@/components/ui/feedback-button';

interface FeedbackLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function FeedbackLink({ children, className = '' }: FeedbackLinkProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowFeedback(true);
        }}
        className={className || "text-current hover:text-primary transition-colors"}
      >
        {children}
      </button>
      {showFeedback && (
        <div style={{ display: 'none' }}>
          <FeedbackButton variant="ghost" />
        </div>
      )}
    </>
  );
}

// Alternative: Direct link to Telegram for support
export function SupportLink({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <a 
      href="https://t.me/+UI6uTKgfswUwNzhk" 
      target="_blank" 
      rel="noopener noreferrer"
      className={className || "text-current hover:text-primary transition-colors"}
    >
      {children}
    </a>
  );
}