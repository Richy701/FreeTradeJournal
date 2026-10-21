import { describe, it, expect } from 'vitest';
import { isAutoAiPausedError, isFreeAiQuotaError } from './ai-quota';

describe('isAutoAiPausedError', () => {
  it('matches the daily auto-AI cap from the callable', () => {
    const err = { code: 'functions/resource-exhausted', message: 'Automatic AI suggestions are paused until tomorrow.' };
    expect(isAutoAiPausedError(err)).toBe(true);
    // The daily cap must never flip the monthly coaching gate.
    expect(isFreeAiQuotaError(err)).toBe(false);
  });

  it('ignores the monthly coaching quota and ordinary failures', () => {
    expect(isAutoAiPausedError({ code: 'functions/permission-denied', message: "You've used all 20 free AI coaching runs this month." })).toBe(false);
    expect(isAutoAiPausedError(new Error('network'))).toBe(false);
    expect(isAutoAiPausedError(null)).toBe(false);
  });
});
