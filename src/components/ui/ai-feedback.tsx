import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { trackEvent } from '@/lib/analytics';

interface AIFeedbackProps {
  feature: string;
  responseId?: string;
  className?: string;
  onFeedback?: (helpful: boolean) => void;
}

export function AIFeedback({ feature, responseId, className, onFeedback }: AIFeedbackProps) {
  const { user, isDemo } = useAuth();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (isDemo || !user) return null;

  async function handleVote(helpful: boolean) {
    const newVote = helpful ? 'up' : 'down';
    if (vote === newVote) return;

    setVote(newVote);
    setSubmitted(true);
    onFeedback?.(helpful);

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'sendFeedback');
      await fn({
        type: 'ai_feedback',
        message: `AI ${feature}: ${helpful ? 'helpful' : 'not helpful'}`,
        rating: helpful ? 5 : 1,
        page: feature,
        wantFollowUp: false,
      });
    } catch {
      // Non-critical
    }

    trackEvent('ai_feedback', { feature, helpful, responseId });
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {!submitted && (
        <span className="text-[11px] text-muted-foreground mr-0.5 font-medium">Was this helpful?</span>
      )}
      {submitted && vote && (
        <span className="text-[11px] text-muted-foreground mr-0.5 animate-in fade-in slide-in-from-left-2 duration-300 font-medium">
          {vote === 'up' ? 'Thanks for the feedback!' : 'Noted — we\'ll improve this.'}
        </span>
      )}
      <button
        type="button"
        onClick={() => handleVote(true)}
        disabled={submitted}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          vote === 'up'
            ? "text-green-500 bg-green-500/15 scale-110"
            : "text-muted-foreground/40 hover:text-green-500 hover:bg-green-500/10 hover:scale-110 active:scale-95",
          submitted && vote !== 'up' && "opacity-20 scale-90"
        )}
        aria-label="Helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleVote(false)}
        disabled={submitted}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200",
          vote === 'down'
            ? "text-red-500 bg-red-500/15 scale-110"
            : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-95",
          submitted && vote !== 'down' && "opacity-20 scale-90"
        )}
        aria-label="Not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
