import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Minus, X, Target } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useProStatus } from '@/contexts/pro-context';
import { useSync } from '@/contexts/sync-context';
import { useWeeklyFocus } from '@/hooks/use-weekly-focus';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { addDays, plansForAccount, summarizeFocus, type FocusPlan, type CheckInStatus } from '@/lib/weekly-focus';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export type FocusSuggestion = { message: string; selection: number };
type FocusState = ReturnType<typeof useWeeklyFocus>;
const dayLabel = (day: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', options);
const statusLabels: Record<CheckInStatus, string> = { followed: 'Followed it', missed: 'Missed it', no_trading: "Didn't trade" };

export function WeeklyFocus({ suggestion, compact = false }: { suggestion?: FocusSuggestion; compact?: boolean }) {
  const { user, loading } = useAuth();
  const { activeAccount, isAllAccounts, loading: accountsLoading } = useAccounts();
  const { isPro, isLoading } = useProStatus();
  const { initialSyncDone } = useSync();
  if (loading || accountsLoading || isLoading || !user || (isPro && !initialSyncDone)) return null;
  if (isAllAccounts || !activeAccount) return compact ? null : (
    <Card id="weekly-focus"><CardContent className="pt-6"><h2 className="font-semibold">Your weekly focus</h2><p className="mt-1 text-sm text-muted-foreground">Choose one trading account in the header to track a habit for that account.</p></CardContent></Card>
  );
  return <AccountFocus key={`${user.uid}:${activeAccount.id}`} accountId={activeAccount.id} accountName={activeAccount.name} suggestion={suggestion} compact={compact} />;
}

function AccountFocus({ accountId, accountName, suggestion, compact }: { accountId: string; accountName: string; suggestion?: FocusSuggestion; compact: boolean }) {
  const focus = useWeeklyFocus();
  const demoGuard = useDemoGuard();
  const plans = plansForAccount(focus.records, accountId);
  const latest = plans[0];
  const summary = latest ? summarizeFocus(focus.records, latest, focus.today) : null;
  const needsReview = !!summary?.due && !summary.review;
  const hasOpenFocus = !!latest && !summary?.review;
  const newSuggestion = suggestion && (!latest || suggestion.selection > Date.parse(latest.createdAt)) ? suggestion : undefined;
  const [habit, setHabit] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!newSuggestion || compact) return;
    if (!hasOpenFocus) {
      setHabit(newSuggestion.message.length <= 240 ? newSuggestion.message : '');
      input.current?.focus({ preventScroll: true });
    }
    document.getElementById('weekly-focus')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [newSuggestion, compact, hasOpenFocus]);

  if (compact) {
    if (!latest || focus.error || !hasOpenFocus) return null;
    const todayRecorded = !!summary?.checks.has(focus.today);
    const elapsedDays = summary?.days.filter(day => day <= focus.today).length ?? 0;
    const recordedDays = summary?.recorded ?? 0;
    const action = needsReview ? 'Review week' : todayRecorded ? 'Open focus' : 'Check in';
    return (
      <Card aria-label="Weekly focus reminder" className="mx-4 mb-4 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Target className="h-5 w-5" aria-hidden="true" /></div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium text-muted-foreground">Your weekly focus</p><Badge variant="secondary" className="font-normal">{needsReview ? 'Review ready' : `Day ${elapsedDays} of 7`}</Badge></div>
              <p className="max-w-2xl break-words text-base font-semibold leading-snug">{latest.habit}</p>
              <p className="text-xs text-muted-foreground">{needsReview ? 'Reflect on your week and choose what comes next.' : todayRecorded ? "Today’s check-in is saved. Keep showing up." : 'A quick check-in keeps your practice on track.'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between lg:shrink-0 lg:gap-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="space-y-2 sm:w-40"><div className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">Days checked in</span><span className="font-medium tabular-nums">{recordedDays} / 7</span></div><Progress value={recordedDays / 7 * 100} aria-label="Weekly check-in progress" className="h-1.5" /></div>
            <Button asChild className="min-h-11 w-full sm:w-auto"><Link to="/coach#weekly-focus" onClick={() => trackEvent('weekly_focus_reminder_opened', { review_due: needsReview })}>{action}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (focus.error) return <Card id="weekly-focus"><CardContent className="pt-6"><p role="alert">{focus.error}</p></CardContent></Card>;

  return (
    <Card id="weekly-focus" className="scroll-mt-24 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b p-5 sm:px-6">
        <div className="space-y-1"><CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" />Your weekly focus</CardTitle><p className="text-xs text-muted-foreground">{accountName}</p></div><Badge variant="outline" className="shrink-0 font-normal">{needsReview ? 'Review ready' : hasOpenFocus ? 'In progress' : '7-day practice'}</Badge>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        {hasOpenFocus && latest ? (
          <>
            {newSuggestion && <p className="text-sm text-muted-foreground">You already have a focus. Finish this week's review before choosing another.</p>}
            <CurrentFocus key={latest.id} plan={latest} focus={focus} />
          </>
        ) : (
          <form className="max-w-2xl space-y-4" onSubmit={async event => {
            event.preventDefault();
            if (demoGuard('save your weekly focus')) return;
            const saved = await focus.save({ kind: 'plan', id: crypto.randomUUID(), accountId, createdAt: new Date().toISOString(), startDate: focus.today, habit: habit.trim() });
            if (saved) setHabit('');
          }}>
            <div className="space-y-2"><h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Small habit. Better trading discipline.</h3><p className="text-sm leading-relaxed text-muted-foreground">Choose one action, check in after trading, then reflect on what worked.</p></div>
            {summary?.review && <p className="text-sm font-medium">Review saved. Choose your focus for the next seven days.</p>}
            {newSuggestion && <Accordion type="single" collapsible><AccordionItem value="tip"><AccordionTrigger className="text-sm">The coaching tip you chose</AccordionTrigger><AccordionContent className="whitespace-pre-wrap text-muted-foreground">{newSuggestion.message}</AccordionContent></AccordionItem></Accordion>}
            <div className="space-y-2">
              <Label htmlFor="weekly-focus-habit">What is one thing you want to practise?</Label>
              <Textarea ref={input} id="weekly-focus-habit" value={habit} onChange={event => setHabit(event.target.value)} maxLength={240} required aria-describedby="weekly-focus-help" />
              <p id="weekly-focus-help" className="text-xs text-muted-foreground">Write one action you can check at the end of a trading day. You can use a coaching tip below as a starting point.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={focus.saving || !habit.trim()}>Start seven-day focus</Button>
              {latest && <Button variant="outline" type="button" onClick={() => { setHabit(latest.habit); input.current?.focus(); }}>Use the same habit</Button>}
            </div>
          </form>
        )}
        {plans.some(plan => summarizeFocus(focus.records, plan, focus.today).review) && (
          <Accordion type="single" collapsible className="border-t"><AccordionItem value="history" className="border-0"><AccordionTrigger className="text-sm">Past weekly reviews</AccordionTrigger><AccordionContent>
            <div className="space-y-4">
              {plans.filter(plan => summarizeFocus(focus.records, plan, focus.today).review).map(plan => {
                const past = summarizeFocus(focus.records, plan, focus.today);
                return <article key={plan.id} className="border-l-2 border-primary/30 pl-4"><p className="text-xs text-muted-foreground">{dayLabel(plan.startDate)} – {dayLabel(addDays(plan.startDate, 6))}{past.review?.endedEarly ? ' · Ended early' : ''}</p><h3 className="mt-1 break-words text-sm font-semibold">{plan.habit}</h3><p className="mt-1 text-xs text-muted-foreground">{past.followed} followed · {past.missed} missed · {past.noTrading} didn't trade · {past.unrecorded} unrecorded</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{past.review?.reflection}</p></article>;
              })}
            </div>
          </AccordionContent></AccordionItem></Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentFocus({ plan, focus }: { plan: FocusPlan; focus: FocusState }) {
  const summary = summarizeFocus(focus.records, plan, focus.today);
  const [chosenDay, setChosenDay] = useState(focus.today);
  const [reflection, setReflection] = useState('');
  const [endingEarly, setEndingEarly] = useState(false);
  const demoGuard = useDemoGuard();
  const availableDays = summary.days.filter(day => day <= focus.today);
  const selectedDay = availableDays.includes(chosenDay) ? chosenDay : availableDays.at(-1);
  const status = selectedDay ? summary.checks.get(selectedDay) : undefined;
  const recordedCount = summary.checks.size;
  const statusIcons = { followed: Check, missed: X, no_trading: Minus };
  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{dayLabel(plan.startDate)} – {dayLabel(addDays(plan.startDate, 6))}</p>
        <h3 className="whitespace-pre-wrap break-words text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{plan.habit}</h3>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2" role="group" aria-label="Choose a day to check in">
            {summary.days.map(day => {
              const recorded = summary.checks.get(day);
              const StatusIcon = recorded ? statusIcons[recorded] : null;
              return <Button key={day} type="button" variant={selectedDay === day ? 'secondary' : 'ghost'} disabled={day > focus.today || focus.saving} aria-pressed={selectedDay === day} aria-label={`${dayLabel(day, { weekday: 'long', day: 'numeric', month: 'short' })}: ${recorded ? statusLabels[recorded] : 'Not recorded'}`} onClick={() => setChosenDay(day)} className={cn('h-auto min-h-24 min-w-0 flex-col gap-1 px-0 py-2', selectedDay === day && 'ring-1 ring-primary')}>
                <span className="text-[11px] font-normal text-muted-foreground">{dayLabel(day, { weekday: 'short' })}</span>
                <span className="text-base font-semibold tabular-nums">{dayLabel(day, { day: 'numeric' })}</span>
                <span className="flex h-4 items-center justify-center" aria-hidden="true">{StatusIcon ? <StatusIcon className="h-3 w-3" /> : <span className={cn('h-1 w-1 rounded-full', day === focus.today ? 'bg-primary' : 'bg-muted-foreground/30')} />}</span>
              </Button>;
            })}
          </div>
          <Separator />
          {selectedDay && <fieldset disabled={focus.saving} className="space-y-3"><legend className="text-sm font-medium">How did it go on {dayLabel(selectedDay)}?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(statusLabels) as CheckInStatus[]).map(value => {
                const StatusIcon = statusIcons[value];
                return <Button key={value} type="button" variant={status === value ? 'default' : 'outline'} aria-pressed={status === value} className="min-h-11 px-2" onClick={async () => {
                  if (status === value || demoGuard('save a focus check-in')) return;
                  await focus.save({ kind: 'checkin', id: crypto.randomUUID(), accountId: plan.accountId, planId: plan.id, createdAt: new Date().toISOString(), date: selectedDay, status: value });
                }}><StatusIcon />{statusLabels[value]}</Button>;
              })}
            </div>
            <p className="text-xs text-muted-foreground">{status ? 'Check-in saved. You can change your answer.' : 'One honest check-in is enough. Missed days are part of learning.'}</p>
          </fieldset>}
        </div>
        <div className="min-w-0 space-y-5 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div role="status" className="space-y-3">
            <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-medium">This week</h4><span className="text-xs tabular-nums text-muted-foreground">{recordedCount} / 7 checked in</span></div>
            <Progress value={recordedCount / 7 * 100} aria-label="Days checked in" />
            <p className="text-sm">{summary.scored ? `Followed on ${summary.followed} of ${summary.scored} recorded trading days` : 'No trading-day check-ins yet'}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{summary.noTrading} didn't trade · {summary.unrecorded} unrecorded. Unrecorded days are not scored.</p>
          </div>
          <Separator />
          {summary.due || endingEarly ? <form className="space-y-3" onSubmit={async event => {
            event.preventDefault();
            if (demoGuard('save your weekly review')) return;
            await focus.save({ kind: 'review', id: crypto.randomUUID(), accountId: plan.accountId, planId: plan.id, createdAt: new Date().toISOString(), reflection: reflection.trim(), endedEarly: !summary.due, endDate: focus.today });
          }}>
            <h3 className="text-base font-semibold">{summary.due ? 'Your seven-day review' : 'End this focus early'}</h3>
            <Label htmlFor="weekly-focus-reflection" className="block text-xs leading-relaxed text-muted-foreground">What helped, and what will you change next week?</Label>
            <Textarea id="weekly-focus-reflection" className="min-h-28 resize-y" value={reflection} onChange={event => setReflection(event.target.value)} maxLength={1000} required />
            <div className="flex flex-wrap gap-2"><Button type="submit" className="h-auto min-h-11 whitespace-normal" disabled={focus.saving || !reflection.trim()}>{summary.due ? 'Save weekly review' : 'Save reflection and end focus'}</Button>{!summary.due && <Button type="button" variant="outline" className="min-h-11" onClick={() => setEndingEarly(false)}>Keep going</Button>}</div>
          </form> : <div className="space-y-2">
            <p className="text-sm font-medium">Review on {dayLabel(addDays(plan.startDate, 7))}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">Look back at the week and decide what to practise next. You can correct earlier check-ins until then.</p>
            <Button type="button" variant="ghost" className="-ml-3 min-h-11 px-3 text-xs text-muted-foreground" onClick={() => setEndingEarly(true)}>End focus early<ArrowRight /></Button>
          </div>}
        </div>
      </div>
    </div>
  );
}
