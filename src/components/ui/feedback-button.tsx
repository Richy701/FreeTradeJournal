import { useState, useEffect } from 'react';
import { Chat, Bug, Lightbulb, Star, CheckCircle, CaretRight, ArrowLeft, Envelope, Image as ImageIcon, Info, X } from '@phosphor-icons/react';
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
import { compressImage } from '@/utils/image-store';
import { LATEST_CHANGELOG_VERSION } from '@/constants/changelog';

export type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  className?: string;
  buttonText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  context?: string;
  defaultType?: FeedbackType;
  /** When set, the dialog opens directly on the testimonial step with this star rating. */
  testimonialRating?: number;
}

export function FeedbackButton({
  variant = 'outline',
  className = '',
  buttonText,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  context,
  defaultType,
  testimonialRating,
}: FeedbackButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  // Controlled mode — just render the dialog, no trigger button
  if (controlledOpen !== undefined) {
    return <FeedbackDialog open={open} onOpenChange={setOpen} context={context} defaultType={defaultType} testimonialRating={testimonialRating} />;
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
          <Chat className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        </button>
        <FeedbackDialog open={open} onOpenChange={setOpen} context={context} defaultType={defaultType} />
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
        <Chat className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>{buttonText || 'Feedback'}</span>
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} context={context} defaultType={defaultType} />
    </>
  );
}

const FEEDBACK_TYPES = [
  {
    value: 'bug',
    label: 'Bug report',
    description: "Something isn't working",
    icon: Bug,
  },
  {
    value: 'feature',
    label: 'Feature request',
    description: 'Suggest an improvement',
    icon: Lightbulb,
  },
  {
    value: 'general',
    label: 'General feedback',
    description: 'Share your thoughts',
    icon: Chat,
  },
] as const;

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

function getPageContext(): string {
  const path = window.location.pathname;
  const labels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/trades': 'Trade Log',
    '/settings': 'Settings',
    '/ideas': 'Trade Insights',
    '/coach': 'AI Coach',
    '/journal': 'Journal',
    '/goals': 'Goals & Risk Management',
    '/prop-tracker': 'Prop Tracker',
    '/pricing': 'Pricing',
    '/documentation': 'Documentation',
    '/profile': 'Profile',
  };
  return labels[path] || path;
}

function getDiagnostics(page: string): Record<string, string> {
  return {
    'App version': LATEST_CHANGELOG_VERSION,
    Page: page,
    URL: window.location.href,
    Browser: navigator.userAgent,
    Screen: `${window.innerWidth}×${window.innerHeight}`,
    Theme: document.documentElement.classList.contains('dark') ? 'Dark' : 'Light',
  };
}

function FeedbackDialog({
  open,
  onOpenChange,
  context,
  defaultType,
  testimonialRating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: string;
  defaultType?: FeedbackType;
  testimonialRating?: number;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('feedback');
  const [type, setType] = useState<FeedbackType>(defaultType || 'general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wantFollowUp, setWantFollowUp] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);

  // Testimonial fields
  const [testimonialName, setTestimonialName] = useState(user?.displayName || '');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialQuote, setTestimonialQuote] = useState('');
  const [testimonialConsent, setTestimonialConsent] = useState(false);

  // Promoters arriving from the NPS pulse already told us they love it —
  // skip the feedback form and open straight on the testimonial step.
  useEffect(() => {
    if (open && testimonialRating) {
      setStep('testimonial');
      setRating(testimonialRating);
    }
  }, [open, testimonialRating]);

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setStep('feedback');
        setMessage('');
        setType(defaultType || 'general');
        setRating(0);
        setHoverRating(0);
        setWantFollowUp(false);
        setScreenshot(null);
        setAttaching(false);
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
      const page = context || getPageContext();
      await fn({
        type,
        message: message.trim(),
        rating,
        page,
        wantFollowUp,
        diagnostics: type === 'bug' ? getDiagnostics(page) : undefined,
        screenshot: screenshot || undefined,
      });

      // A star rating is a sentiment signal — reset the NPS pulse timer so
      // SatisfactionPulse doesn't ask "how are we doing" right after they told us.
      if (type !== 'bug' && rating > 0) {
        localStorage.setItem('ftj-satisfaction-pulse', String(Date.now()));
      }

      // If they loved it, invite them to leave a testimonial (never after a bug report)
      if (type !== 'bug' && rating >= 4) {
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

  async function handleScreenshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttaching(true);
    try {
      setScreenshot(await compressImage(file, 1200, 0.6));
    } catch {
      toast.error('Could not process that image.');
    } finally {
      setAttaching(false);
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
            <div className="px-6 pt-6 pb-4 border-b border-border/70 bg-gradient-to-b from-primary/[0.03] to-transparent">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Chat className="h-[18px] w-[18px]" weight="fill" />
                </div>
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-lg font-semibold leading-tight">Share your feedback</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Help us make FreeTradeJournal better for you.
                    {context && (
                      <span className="inline-flex items-center ml-1.5 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground/80 align-middle">
                        {context}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className={cn("flex flex-col gap-5 px-6 py-5 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
              {/* Type selector — first, so the form can adapt to it */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">What kind of feedback is this?</span>
                <div className="flex flex-col gap-2">
                  {FEEDBACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isActive = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setType(t.value);
                          // Bugs have no star UI — clear any stale rating so it can't
                          // silently trigger the testimonial upsell on submit.
                          if (t.value === 'bug') setRating(0);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150",
                          isActive
                            ? "bg-primary/10 border-primary/40"
                            : "border-border/80 hover:border-border bg-muted/40 hover:bg-muted/70"
                        )}
                      >
                        <div className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("text-sm font-medium leading-tight", isActive ? "text-primary" : "text-foreground")}>
                            {t.label}
                          </span>
                          <span className="mt-0.5 text-xs text-muted-foreground leading-tight">
                            {t.description}
                          </span>
                        </div>
                        {isActive && (
                          <CheckCircle weight="fill" className="ml-auto h-5 w-5 flex-shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star rating — only for feedback where a sentiment makes sense (not bugs) */}
              {type !== 'bug' && (
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
                          weight={star <= activeRating ? 'fill' : 'regular'}
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
              )}

              {/* Bug-only: auto diagnostics preview + optional screenshot */}
              {type === 'bug' && (
                <>
                  <div className="rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Auto-included to help us debug</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      App v{LATEST_CHANGELOG_VERSION} · {context || getPageContext()} · your browser &amp; screen size. No personal data.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Screenshot <span className="font-normal text-muted-foreground">(optional)</span></span>
                    {screenshot ? (
                      <div className="relative w-fit">
                        <img src={screenshot} alt="Screenshot preview" className="h-24 rounded-lg border border-border object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          aria-label="Remove screenshot"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-dashed border-border/80 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{attaching ? 'Processing…' : 'Click to attach an image'}</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleScreenshotSelect} />
                      </label>
                    )}
                  </div>
                </>
              )}

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label htmlFor="fb-message" className="text-sm font-medium">Tell us more</label>
                <textarea
                  id="fb-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={PLACEHOLDERS[type]}
                  rows={4}
                  maxLength={2000}
                  required
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors"
                />
                <span className="text-xs text-muted-foreground">
                  {message.length > 0 ? `${message.length}/2000` : 'Max 2000 characters'}
                </span>
              </div>

              {/* Follow-up toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" className="sr-only peer" checked={wantFollowUp} onChange={(e) => setWantFollowUp(e.target.checked)} />
                <div className={cn(
                  "h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                  wantFollowUp ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                )}>
                  {wantFollowUp && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Envelope className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">I'd like a follow-up reply</span>
                </div>
              </label>

              <div className="flex items-center gap-3 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => handleClose(false)} disabled={loading} className="text-muted-foreground">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading || !message.trim() || attaching} className="ml-auto gap-1.5">
                  {loading ? (
                    <><span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />Sending...</>
                  ) : (
                    <>Send feedback <CaretRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'testimonial' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border/70 bg-gradient-to-b from-amber-500/[0.04] to-transparent">
              <div className="flex items-center gap-1.5 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} weight={s <= rating ? 'fill' : 'regular'} className={cn("h-5 w-5 transition-transform", s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/20")} />
                ))}
              </div>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Would you share your story?</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  You loved it — we'd love to feature you on our homepage to help other traders discover FreeTradeJournal.
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleTestimonialSubmit} className={cn("flex flex-col gap-4 px-6 py-5 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="testimonial-name" className="text-sm font-medium">Your name</label>
                <input
                  id="testimonial-name"
                  type="text"
                  value={testimonialName}
                  onChange={(e) => setTestimonialName(e.target.value)}
                  placeholder="How should we credit you?"
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">What kind of trader are you?</span>
                <div role="radiogroup" aria-label="Trader type" className="flex flex-wrap gap-2">
                  {TRADER_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      role="radio"
                      aria-checked={testimonialRole === role}
                      onClick={() => setTestimonialRole(role)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                        testimonialRole === role
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="testimonial-quote" className="text-sm font-medium">What do you love about FreeTradeJournal?</label>
                <textarea
                  id="testimonial-quote"
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="Share what's made the biggest difference to your trading..."
                  rows={4}
                  maxLength={300}
                  required
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <span className="text-xs text-muted-foreground">{testimonialQuote.length}/300</span>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="sr-only peer" checked={testimonialConsent} onChange={(e) => setTestimonialConsent(e.target.checked)} />
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                  testimonialConsent ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                )}>
                  {testimonialConsent && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
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
                    <>Submit testimonial <CaretRight className="h-3.5 w-3.5" /></>
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
    <div className="flex flex-col items-center justify-center gap-5 px-8 py-14 text-center bg-gradient-to-b from-green-500/[0.04] via-transparent to-transparent">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping opacity-40" />
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 shadow-sm shadow-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <DialogTitle className="text-lg font-semibold">Thanks — you're the best!</DialogTitle>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
          We read every message and use it to make FreeTradeJournal better for traders like you.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onClose} className="mt-1">
        Done
      </Button>
    </div>
  );
}
