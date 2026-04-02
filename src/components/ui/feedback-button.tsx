import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
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
  { value: 'bug', label: 'Bug report' },
  { value: 'feature', label: 'Feature request' },
  { value: 'general', label: 'General feedback' },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]['value'];

function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'sendFeedback');
      await fn({ type, message: message.trim() });
      toast.success('Feedback sent — thanks!');
      onOpenChange(false);
      setMessage('');
      setType('general');
    } catch {
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Report a bug, request a feature, or share your thoughts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="flex gap-2">
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-md text-xs font-medium border transition-colors",
                  type === t.value
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug'
                ? "Describe what happened and how to reproduce it..."
                : type === 'feature'
                ? "What would you like to see added or improved?"
                : "What's on your mind?"
            }
            rows={5}
            maxLength={2000}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {message.length}/2000
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading || !message.trim()}>
                {loading ? 'Sending...' : 'Send feedback'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
