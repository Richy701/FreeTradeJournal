import { beforeEach, describe, expect, it } from 'vitest';
import { hasExistingOnboardingData, pruneSeedAccount } from './onboarding';

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

describe('pruneSeedAccount — leftover placeholder beside a real account', () => {
  const ghost = { ...seed, isDefault: false };
  const real = { id: 'account-1', name: 'Topstep', type: 'prop-firm', broker: 'TopstepTrader', currency: 'USD', isDefault: true };

  it('drops an unused placeholder and keeps the array identity when nothing changes', () => {
    expect(pruneSeedAccount([ghost, real], [{ accountId: real.id }])).toEqual([real]);
    const only = [ghost];
    expect(pruneSeedAccount(only, [])).toBe(only);
  });
  it('keeps the placeholder when a record resolves to it, including legacy records', () => {
    const list = [ghost, real];
    expect(pruneSeedAccount(list, [{ accountId: ghost.id }])).toBe(list);
    expect(pruneSeedAccount(list, [{ accountId: null }])).toBe(list);
    expect(pruneSeedAccount(list, [{}])).toBe(list);
  });
  it('keeps a customized placeholder', () => {
    const list = [{ ...ghost, balance: 100 }, real];
    expect(pruneSeedAccount(list, [])).toBe(list);
  });
  it('promotes a survivor when the placeholder was the default', () => {
    const out = pruneSeedAccount([{ ...ghost, isDefault: true }, { ...real, isDefault: false }], []);
    expect(out).toEqual([{ ...real, isDefault: true }]);
  });
});
