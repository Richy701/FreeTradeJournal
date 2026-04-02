import { useState } from 'react';
import { MessageSquare, Bug, Sparkles, Star, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  className?: string;
  buttonText?: string;
}

export function FeedbackButton({
  variant = 'outline',
  className = '',
  buttonText,
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 p-4",
            "bg-primary hover:bg-primary/90",
            "text-primary-foreground rounded-full",
            "shadow-lg hover:shadow-xl hover:scale-110",
            "transition-[transform,opacity] duration-300 group",
            className
          )}
          aria-label="Send feedback"
        >
          <MessageSquare className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        </button>
        <FeedbackDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn("gap-2 group", className)}
      >
        <MessageSquare className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>{buttonText || 'Feedback'}</span>
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

const FEEDBACK_TYPES = [
  {
    value: 'bug',
    label: 'Bug report',
    description: 'Something isn\'t working',
    icon: Bug,
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    activeBg: 'bg-red-500/15 border-red-500/40',
  },
  {
    value: 'feature',
    label: 'Feature request',
    description: 'Suggest an improvement',
    icon: Sparkles,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
    activeBg: 'bg-amber-500/15 border-amber-500/40',
  },
  {
    value: 'general',
    label: 'General feedback',
    description: 'Share your thoughts',
    icon: MessageSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    activeBg: 'bg-blue-500/15 border-blue-500/40',
  },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]['value'];

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: "What went wrong? What were you doing when it happened?",
  feature: "What would you like to see? How would it help your trading?",
  general: "What's on your mind? We read every message.",
};

const STAR_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Love it'];

function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setDone(false);
        setMessage('');
        setType('general');
        setRating(0);
        setHoverRating(0);
      }, 300);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'sendFeedback');
      await fn({ type, message: message.trim(), rating });
      setDone(true);
    } catch {
      toast.error('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeRating = hoverRating || rating;
  const selectedType = FEEDBACK_TYPES.find((t) => t.value === type)!;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        {done ? (
          <SuccessScreen onClose={() => handleClose(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="text-lg">Share your feedback</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Help us make FreeTradeJournal better for you.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
              {/* Star rating */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">How's your experience so far?</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="group p-0.5 transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors duration-100",
                          star <= activeRating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted-foreground/30 group-hover:text-amber-300"
                        )}
                      />
                    </button>
                  ))}
                  {activeRating > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground animate-in fade-in duration-200">
                      {STAR_LABELS[activeRating - 1]}
                    </span>
                  )}
                </div>
              </div>

              {/* Type selector */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">What kind of feedback is this?</span>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isActive = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all duration-150",
                          isActive ? t.activeBg : "border-border/60 hover:border-border bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? t.color : "text-muted-foreground")} />
                        <span className={cn("text-xs font-medium leading-tight", isActive ? t.color : "text-muted-foreground")}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Tell us more</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={PLACEHOLDERS[type]}
                  rows={4}
                  maxLength={2000}
                  required
                  className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/60">
                    {message.length > 0 ? `${message.length}/2000` : 'Max 2000 characters'}
                  </span>
                  {rating === 0 && message.length === 0 && (
                    <span className="text-xs text-muted-foreground/50">A rating is optional</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClose(false)}
                  disabled={loading}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !message.trim()}
                  className="ml-auto gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send feedback
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="h-7 w-7 text-green-500" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold">Thanks for the feedback!</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          We read every message and use it to improve FreeTradeJournal. You're helping make it better.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
        Done
      </Button>
    </div>
  );
}
