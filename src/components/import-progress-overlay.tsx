import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';

export interface ImportSummary {
  imported: number;
  duplicates: number;
  /** Rows the parser couldn't read and skipped. */
  failedRows: number;
  /** Net P&L of the newly imported trades only. */
  netPnl: number;
}

interface ImportProgressOverlayProps {
  /** Set once the import has been saved; null hides the overlay. */
  summary: ImportSummary | null;
  onClose: () => void;
}

// The save itself takes milliseconds, so the checklist is paced for reading:
// each step ticks off in turn, then the result card takes over.
const STEP_MS = 340;
const AUTO_CLOSE_MS = 3500;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

function useCountUp(target: number, run: boolean, instant: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) { setValue(0); return; }
    if (instant) { setValue(target); return; }
    const controls = animate(0, target, { duration: 0.9, ease: EASE_OUT, onUpdate: setValue });
    return () => controls.stop();
  }, [target, run, instant]);
  return value;
}

export function ImportProgressOverlay({ summary, onClose }: ImportProgressOverlayProps) {
  const { themeColors, alpha } = useThemePresets();
  const { formatCurrency } = useSettings();
  const reduceMotion = !!useReducedMotion();
  // 0-3 = that step is running, 4 = all done and the result card is showing.
  const [stage, setStage] = useState(0);
  const doneRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const steps = summary
    ? [
        'Reading your file',
        'Matching dates and P&L',
        summary.duplicates > 0
          ? `Skipping ${summary.duplicates} duplicate${summary.duplicates === 1 ? '' : 's'}`
          : 'Checking for duplicates',
        'Saving to your journal',
      ]
    : [];

  useEffect(() => {
    if (!summary) { setStage(0); return; }
    if (reduceMotion) { setStage(4); return; }
    setStage(0);
    const timers = [1, 2, 3, 4].map((s) => window.setTimeout(() => setStage(s), s * STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, [summary, reduceMotion]);

  const showResult = !!summary && stage >= 4;

  useEffect(() => {
    if (!showResult) return;
    doneRef.current?.focus();
    const t = window.setTimeout(() => onCloseRef.current(), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [showResult]);

  useEffect(() => {
    if (!summary) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [summary]);

  const count = useCountUp(summary?.imported ?? 0, showResult, reduceMotion);
  const pnl = useCountUp(summary?.netPnl ?? 0, showResult, reduceMotion);
  const pnlColor = (summary?.netPnl ?? 0) >= 0 ? themeColors.profit : themeColors.loss;
  const nothingNew = summary?.imported === 0;

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          key="import-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Importing trades"
        >
          <motion.div
            className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!showResult ? (
                <motion.div
                  key="steps"
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <ul className="space-y-3">
                    {steps.map((label, i) => {
                      const done = stage > i;
                      const active = stage === i;
                      return (
                        <motion.li
                          key={i}
                          className="flex items-start gap-3 text-sm"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                        >
                          <span className="mt-0.5 h-4 w-4 shrink-0 flex items-center justify-center">
                            {done ? (
                              <motion.span
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                                className="h-4 w-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: themeColors.primary }}
                              >
                                <Check weight="bold" className="h-2.5 w-2.5" style={{ color: themeColors.primaryButtonText }} />
                              </motion.span>
                            ) : active ? (
                              <span
                                className="h-3.5 w-3.5 border-2 rounded-full animate-spin"
                                style={{ borderColor: themeColors.primary, borderTopColor: 'transparent' }}
                              />
                            ) : (
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-border" />
                            )}
                          </span>
                          <span className={done || active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                  <Progress value={(stage / steps.length) * 100} indicatorColor={themeColors.primary} />
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="flex flex-col items-center text-center"
                  aria-live="polite"
                >
                  <svg viewBox="0 0 52 52" className="h-14 w-14 mb-4" aria-hidden="true">
                    <motion.circle
                      cx="26" cy="26" r="24" fill="none" strokeWidth="2.5" strokeLinecap="round"
                      transform="rotate(-90 26 26)"
                      stroke={nothingNew ? 'hsl(var(--muted-foreground))' : themeColors.primary}
                      style={{ fill: nothingNew ? 'transparent' : alpha(themeColors.primary, '14') }}
                      initial={reduceMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                    />
                    <motion.path
                      d="M16 27 l7 7 l13 -15" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                      stroke={nothingNew ? 'hsl(var(--muted-foreground))' : themeColors.primary}
                      initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.35, delay: 0.35, ease: EASE_OUT, opacity: { duration: 0.01, delay: 0.35 } }}
                    />
                  </svg>

                  {nothingNew ? (
                    <>
                      <p className="text-lg font-semibold">No new trades</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Every trade in this file is already in your journal.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold tabular-nums">
                        {Math.round(count)} trade{summary.imported === 1 ? '' : 's'} imported
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Net P&L{' '}
                        <span className="font-semibold tabular-nums" style={{ color: pnlColor }}>
                          {formatCurrency(Math.round(pnl * 100) / 100)}
                        </span>
                      </p>
                    </>
                  )}

                  {(summary.duplicates > 0 || summary.failedRows > 0) && (
                    <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                      {summary.duplicates > 0 && (
                        <p>{summary.duplicates} duplicate{summary.duplicates === 1 ? '' : 's'} skipped</p>
                      )}
                      {summary.failedRows > 0 && (
                        <p>{summary.failedRows} row{summary.failedRows === 1 ? '' : 's'} couldn't be read and {summary.failedRows === 1 ? 'was' : 'were'} skipped</p>
                      )}
                    </div>
                  )}

                  {!nothingNew && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      P&L is net of broker commissions and fees.
                    </p>
                  )}

                  <Button ref={doneRef} onClick={onClose} variant="outline" size="sm" className="mt-5 min-w-24">
                    Done
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
