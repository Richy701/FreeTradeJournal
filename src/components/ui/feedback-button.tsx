import { useState } from 'react';
import { MessageSquare, Bug, Sparkles, Star, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth-context';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  className?: string;
  buttonText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FeedbackButton({
  variant = 'outline',
  className = '',
  buttonText,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FeedbackButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  // Controlled mode — just render the dialog, no trigger button
  if (controlledOpen !== undefined) {
    return <FeedbackDialog open={open} onOpenChange={setOpen} />;
  }

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
    description: "Something isn't working",
    icon: Bug,
    color: 'text-red-500',
    activeBg: 'bg-red-500/15 border-red-500/40',
  },
  {
    value: 'feature',
    label: 'Feature request',
    description: 'Suggest an improvement',
    icon: Sparkles,
    color: 'text-amber-500',
    activeBg: 'bg-amber-500/15 border-amber-500/40',
  },
  {
    value: 'general',
    label: 'General feedback',
    description: 'Share your thoughts',
    icon: MessageSquare,
    color: 'text-blue-500',
    activeBg: 'bg-blue-500/15 border-blue-500/40',
  },
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number]['value'];
type Step = 'feedback' | 'testimonial' | 'done';

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug: "What went wrong? What were you doing when it happened?",
  feature: "What would you like to see? How would it help your trading?",
  general: "What's on your mind? We read every message.",
};

const STAR_LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Love it'];

const TRADER_ROLES = [
  'Forex Trader',
  'Futures Trader',
  'Prop Firm Trader',
  'Day Trader',
  'Swing Trader',
  'Options Trader',
  'Crypto Trader',
  'Other',
];

function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('feedback');
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Testimonial fields
  const [testimonialName, setTestimonialName] = useState(user?.displayName || '');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialConsent, setTestimonialConsent] = useState(false);

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setStep('feedback');
        setMessage('');
        setType('general');
        setRating(0);
        setHoverRating(0);
        setTestimonialName(user?.displayName || '');
        setTestimonialRole('');
        setTestimonialQuote('');
        setTestimonialConsent(false);
      }, 300);
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'sendFeedback');
      await fn({ type, message: message.trim(), rating });

      // If they loved it, invite them to leave a testimonial
      if (rating >= 4) {
        setStep('testimonial');
      } else {
        setStep('done');
      }
    } catch {
      toast.error('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestimonialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!testimonialQuote.trim() || !testimonialConsent) return;

    setLoading(true);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fn = httpsCallable(getFunctions(), 'submitTestimonial');
      await fn({
        name: testimonialName.trim() || 'Anonymous',
        role: testimonialRole,
        quote: testimonialQuote.trim(),
        rating,
      });
      setStep('done');
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-10 overflow-hidden bg-border/30">
            <div className="h-full bg-primary animate-[progress_1.4s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
        )}

        {step === 'done' && <SuccessScreen onClose={() => handleClose(false)} />}

        {step === 'feedback' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogHeader>
                <DialogTitle className="text-lg">Share your feedback</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Help us make FreeTradeJournal better for you.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleFeedbackSubmit} className={cn("flex flex-col gap-5 px-6 py-5 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
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
                <span className="text-xs text-muted-foreground/60">
                  {message.length > 0 ? `${message.length}/2000` : 'Max 2000 characters'}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClose(false)} disabled={loading} className="text-muted-foreground">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading || !message.trim()} className="ml-auto gap-1.5">
                  {loading ? (
                    <><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Sending...</>
                  ) : (
                    <>Send feedback <ChevronRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'testimonial' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={cn("h-4 w-4", s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20")} />
                  ))}
                </div>
              </div>
              <DialogHeader>
                <DialogTitle className="text-lg">Would you share your story?</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  You loved it — we'd love to feature you on our homepage to help other traders discover FreeTradeJournal.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleTestimonialSubmit} className={cn("flex flex-col gap-4 px-6 py-5 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Your name</label>
                <input
                  type="text"
                  value={testimonialName}
                  onChange={(e) => setTestimonialName(e.target.value)}
                  placeholder="How should we credit you?"
                  className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">What kind of trader are you?</label>
                <div className="flex flex-wrap gap-2">
                  {TRADER_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTestimonialRole(role)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                        testimonialRole === role
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">What do you love about FreeTradeJournal?</label>
                <textarea
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="Share what's made the biggest difference to your trading..."
                  rows={4}
                  maxLength={300}
                  required
                  className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <span className="text-xs text-muted-foreground/60">{testimonialQuote.length}/300</span>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                  testimonialConsent ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                )}>
                  {testimonialConsent && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <input type="checkbox" className="sr-only" checked={testimonialConsent} onChange={(e) => setTestimonialConsent(e.target.checked)} />
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I'm happy for my name, role, and testimonial to appear on the FreeTradeJournal homepage.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('done')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Skip for now
                </button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !testimonialQuote.trim() || !testimonialConsent}
                  className="ml-auto gap-1.5"
                >
                  {loading ? (
                    <><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Submitting...</>
                  ) : (
                    <>Submit testimonial <ChevronRight className="h-3.5 w-3.5" /></>
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
        <h3 className="text-base font-semibold">Thanks — you're the best!</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          We read every message and use it to make FreeTradeJournal better for traders like you.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
        Done
      </Button>
    </div>
  );
}
