import { describe, expect, it } from 'vitest';
import { loginDestination } from './login-destination';

describe('email destinations through login', () => {
  it('retains subscription and feedback destinations', () => {
    expect(loginDestination({ pathname: '/settings', search: '?tab=subscription', hash: '#subscription' }))
      .toBe('/settings?tab=subscription#subscription');
    expect(loginDestination({ pathname: '/dashboard', search: '?feedback=digest' })).toBe('/dashboard?feedback=digest');
  });
  it('uses a safe local default', () => {
    for (const from of [undefined, { pathname: '//evil.example' }, { pathname: 'https://evil.example' }]) {
      expect(loginDestination(from)).toBe('/dashboard');
    }
  });
});
