import { useState } from 'react';
import { UserMinus, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const EXIT_REASONS = [
  { value: 'not_useful', label: 'Not useful for my trading' },
  { value: 'too_complex', label: 'Too complex to use' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'switched', label: 'Switched to another tool' },
  { value: 'stopped_trading', label: 'Stopped trading' },
  { value: 'privacy', label: 'Privacy/data concerns' },
  { value: 'other', label: 'Other reason' },
] as const;

interface ExitSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  deleting: boolean;
}

export function ExitSurveyDialog({ open, onOpenChange, onConfirmDelete, deleting }: ExitSurveyDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'survey' | 'confirm'>('survey');

  function handleContinue() {
    if (reason) {
      trackEvent('exit_survey_submitted', { reason, details: details.trim() || undefined });

      // Fire-and-forget to backend
      sendExitFeedback(reason, details.trim());
    }
    setStep('confirm');
  }

  function handleDelete() {
    onConfirmDelete();
  }

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) {
      setTimeout(() => {
        setStep('survey');
        setReason(null);
        setDetails('');
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {step === 'survey' ? (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border/70 bg-gradient-to-b from-muted/50 to-transparent">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
                <UserMinus className="h-5 w-5 text-amber-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Before you go...</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  We'd love to understand why so we can improve. What's your main reason for leaving?
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                {EXIT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all duration-150",
                      reason === r.value
                        ? "border-primary/40 bg-primary/[0.08] text-foreground font-medium shadow-sm"
                        : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {reason && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Anything else you'd like to share? (optional)"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                  Stay
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 mb-4 mx-auto">
              <Warning className="h-6 w-6 text-destructive" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-lg font-semibold">Delete Your Account?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                This will permanently delete your account, all local and cloud data, and cancel any active subscription. You will be signed out and this cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function sendExitFeedback(reason: string, details: string) {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const fn = httpsCallable(getFunctions(), 'sendFeedback');
    await fn({
      type: 'churn',
      message: `Exit reason: ${reason}${details ? `\n\nDetails: ${details}` : ''}`,
      rating: 0,
      page: 'Account Deletion',
      wantFollowUp: false,
    });
  } catch {
    // Non-critical
  }
}
