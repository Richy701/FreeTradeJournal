import { beforeEach, describe, expect, it } from 'vitest';
import { hasExistingOnboardingData } from './onboarding';

const put = (key: string, value: unknown) => localStorage.setItem(`user_trader_${key}`, JSON.stringify(value));
const seed = { id: 'default-123', name: 'Main Account', type: 'demo', broker: 'Demo Broker', currency: 'USD' };
beforeEach(() => localStorage.clear());

describe('returning-user evidence', () => {
  it('does not treat empty storage, empty arrays or a seeded account as completed setup', () => {
    expect(hasExistingOnboardingData('trader')).toBe(false);
    put('accounts', []); put('trades', []);
    expect(hasExistingOnboardingData('trader')).toBe(false);
    put('accounts', [seed]);
    expect(hasExistingOnboardingData('trader')).toBe(false);
  });
  it.each(['trades', 'journalEntries'])('protects real %s even on a default account', key => {
    put('accounts', [seed]); put(key, [{ id: 'record-1', accountId: seed.id }]);
    expect(hasExistingOnboardingData('trader')).toBe(true);
  });
  it('recognizes user-created and customized default accounts', () => {
    put('accounts', [{ ...seed, id: 'custom-1' }]);
    expect(hasExistingOnboardingData('trader')).toBe(true);
    put('accounts', [{ ...seed, balance: 0 }]);
    expect(hasExistingOnboardingData('trader')).toBe(true);
  });
  it('rejects malformed data and never uses another account’s records', () => {
    localStorage.setItem('user_trader_accounts', 'broken json');
    put('trades', [null, {}, 'record']);
    expect(hasExistingOnboardingData('trader')).toBe(false);
    put('trades', [{ id: 'record-1' }]);
    expect(hasExistingOnboardingData('other')).toBe(false);
  });
});
