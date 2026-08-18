/**
 * Free-AI-quota signalling between the AI service layer and pro-context.
 *
 * The client's `freeAiQuota` only ever learned about usage from SUCCESSFUL
 * calls, so a tab whose cached quota was stale kept believing it had credits
 * and auto-fired features (risk alerts, coach tips, journal prompts) retried
 * against a server that kept saying no. Any AI call site that sees a
 * permission-denied "quota exhausted" answer calls notifyFreeAiQuotaExhausted();
 * ProProvider listens and flips `hasAIAccess` off for the whole tab.
 */

export const FREE_AI_QUOTA_EXHAUSTED_EVENT = 'ftj:free-ai-quota-exhausted';

// True only for the COACHING allowance being gone. Firebase callable errors
// carry code 'functions/permission-denied'; the streaming HTTP path surfaces
// the server's message text on a 403. The utility allowance ("import reads")
// and the daily auto cap (a 429, "paused until tomorrow") must not flip the
// coaching gate.
export function isFreeAiQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: unknown }).code;
  const message = String((err as { message?: unknown }).message || '');
  if (/import reads|paused until tomorrow/i.test(message)) return false;
  if (code === 'functions/permission-denied') return true;
  return /free AI (queries|coaching runs) this month/i.test(message);
}

export function notifyFreeAiQuotaExhausted(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FREE_AI_QUOTA_EXHAUSTED_EVENT));
}
