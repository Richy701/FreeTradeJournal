import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useProStatus } from '@/contexts/pro-context';
import { notifyDataChange, useSync } from '@/contexts/sync-context';
import { useUserStorage } from '@/utils/user-storage';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { trackEvent } from '@/lib/analytics';
import { trackActivity } from '@/lib/track-activity';
import { FREE_JOURNAL_ENTRY_LIMIT } from '@/constants/pricing';
import { findTradeReview, PLAN_ANSWERS, readReviewEntries, saveTradeReview, type PlanAnswer, type ReviewTrade } from '@/lib/post-trade-review';

export function PostTradeReview({ trade, onClose, captureLesson = false }: { trade: ReviewTrade; onClose: () => void; captureLesson?: boolean }) {
  const { user, loading } = useAuth();
  const { isInScope, loading: accountsLoading } = useAccounts();
  const { isPro, isLoading } = useProStatus();
  const { initialSyncDone } = useSync();
  if (loading || accountsLoading || isLoading || !user || !isInScope(trade) || (isPro && !initialSyncDone)) return null;
  return <ReviewEditor key={`${user.uid}:${trade.accountId}:${trade.id}`} trade={trade} onClose={onClose} captureLesson={captureLesson} />;
}

function ReviewEditor({ trade, onClose, captureLesson }: { trade: ReviewTrade; onClose: () => void; captureLesson: boolean }) {
  const storage = useUserStorage();
  const { isPro } = useProStatus();
  const demoGuard = useDemoGuard();
  const [initial] = useState(() => {
    try { return { entry: findTradeReview(readReviewEntries(storage.getItem('journalEntries')), trade), error: '' }; }
    catch { return { entry: undefined, error: 'Your journal could not be loaded. Close this review and reload before trying again.' }; }
  });
  const [plan, setPlan] = useState<PlanAnswer | ''>(initial.entry?.quickReview?.plan ?? '');
  const [content, setContent] = useState(initial.entry?.content ?? '');
  const initialEmotions = initial.entry?.emotions;
  const [emotion, setEmotion] = useState(Array.isArray(initialEmotions) ? initialEmotions.join(', ') : trade.emotions ?? '');
  const [lesson, setLesson] = useState(initial.entry?.lesson ?? '');
  const [carryForward, setCarryForward] = useState(initial.entry?.lessonPinned ?? false);
  const [savedId, setSavedId] = useState(initial.entry?.id);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState(initial.error);
  return <Dialog open onOpenChange={open => { if (!open && !busy.current) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Post-trade review</DialogTitle>
        <DialogDescription>A quick reflection now. A useful lesson for your next trade.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{trade.symbol}</span>{trade.strategy && <Badge variant="secondary">{trade.strategy}</Badge>}{trade.emotions && <span className="text-xs text-muted-foreground">{trade.emotions}</span>}</div>
      <Separator />
      <form className="space-y-5" onSubmit={async event => {
        event.preventDefault();
        if (busy.current || !plan || initial.error || demoGuard('save your post-trade review')) return;
        busy.current = true; setSaving(true); setError('');
        let previous: string | null = null;
        let writing = false;
        try {
          const trades: ReviewTrade[] = JSON.parse(storage.getItem('trades') ?? '[]');
          const currentTrade = trades.find(item => item.id === trade.id && item.accountId === trade.accountId);
          if (!currentTrade) throw new Error('This trade is no longer available. Close the review and reload your trade log.');
          previous = storage.getItem('journalEntries');
          const result = saveTradeReview(readReviewEntries(previous), currentTrade, plan, content, new Date().toISOString(), captureLesson ? { emotion, lesson, carryForward } : undefined);
          // Do not overwrite a review changed in another open view while this draft was being written.
          const current = findTradeReview(readReviewEntries(previous), currentTrade);
          if (!isPro && !current && result.entries.length > FREE_JOURNAL_ENTRY_LIMIT) throw new Error(`You've reached the free limit of ${FREE_JOURNAL_ENTRY_LIMIT} journal entries. Upgrade to Pro to add more, or edit an existing review.`);
          if (JSON.stringify(current) !== JSON.stringify(initial.entry)) throw new Error('This review changed elsewhere. Close and reopen it to load the latest version.');
          writing = true;
          await storage.setItem('journalEntries', JSON.stringify(result.entries));
          notifyDataChange(); setSavedId(result.entry.id);
          trackEvent('post_trade_review_saved');
          trackActivity('journal_entry_saved', { type: current ? 'edit' : 'new', entryCount: result.entries.length });
          toast.success('Review saved to your journal.');
          onClose();
        } catch (failure) {
          if (writing) { try { await storage.setItem('journalEntries', previous ?? '[]', true); } catch { /* Keep the original failure visible. */ } }
          setError(failure instanceof Error ? failure.message : 'Could not save your review. Please try again.');
        } finally { busy.current = false; setSaving(false); }
      }}>
        <fieldset disabled={saving || !!initial.error} className="space-y-5">
          <div className="space-y-3"><Label id="review-plan-label">Did you follow your plan?</Label>
            <RadioGroup aria-labelledby="review-plan-label" value={plan} onValueChange={value => setPlan(value as PlanAnswer)} className="grid gap-2 sm:grid-cols-2">
              {(Object.entries(PLAN_ANSWERS) as [PlanAnswer, string][]).map(([value, label]) => <Label key={value} htmlFor={`review-plan-${value}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"><RadioGroupItem id={`review-plan-${value}`} value={value} />{label}</Label>)}
            </RadioGroup>
          </div>
          {captureLesson && <div className="space-y-2">
            <Label htmlFor="review-emotion">How did you feel? <span className="font-normal text-muted-foreground">Optional</span></Label>
            <select id="review-emotion" value={emotion} onChange={event => setEmotion(event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose an emotion</option>
              {Array.from(new Set([...(emotion ? [emotion] : []), 'calm', 'confident', 'focused', 'patient', 'anxious', 'frustrated', 'impulsive', 'fearful', 'greedy'])).map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>}
          <div className="space-y-2"><Label htmlFor="trade-review-reflection">What would you repeat or change?</Label><Textarea id="trade-review-reflection" value={content} onChange={event => setContent(event.target.value)} maxLength={5000} required className="min-h-32" aria-describedby="trade-review-help" /><p id="trade-review-help" className="text-xs text-muted-foreground">Focus on your decisions, even if the trade made money. Saved as a linked post-trade journal entry.</p></div>
          {captureLesson && <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <Label htmlFor="review-lesson">One lesson for next time <span className="font-normal text-muted-foreground">Optional</span></Label>
            <Textarea id="review-lesson" value={lesson} onChange={event => setLesson(event.target.value)} maxLength={300} className="min-h-20" />
            <Label className="flex min-h-11 items-center gap-3 text-sm font-normal"><input type="checkbox" checked={carryForward} onChange={event => setCarryForward(event.target.checked)} className="h-4 w-4 accent-primary" />Carry this lesson into my next plan</Label>
            <p className="text-xs text-muted-foreground">Replaces the current reminder for this account. Your earlier lessons stay in your journal.</p>
          </div>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2"><Button type="submit" className="min-h-11" disabled={saving || !!initial.error || !plan || !content.trim()}>{saving ? 'Saving…' : savedId ? 'Update review' : 'Save to journal'}</Button><Button type="button" variant="ghost" className="min-h-11" disabled={saving} onClick={onClose}>Cancel</Button>{savedId && <Button asChild variant="link" disabled={saving}><Link to={`/journal?entry=${encodeURIComponent(savedId)}`} onClick={onClose}>Open in journal</Link></Button>}</div>
      </form>
    </DialogContent>
  </Dialog>;
}
