import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { render } from '@react-email/components';
import { CancellationEmail } from '../src/emails/CancellationEmail';
import { Day21BackupEmail } from '../src/emails/Day21BackupEmail';
import { TrialOfferEmail } from '../src/emails/TrialOfferEmail';
import { TrialOpenEmail } from '../src/emails/TrialOpenEmail';
import { URLS } from '../src/emails/facts';

describe('billing email lifecycle', () => {
  it('confirms renewal cancellation while access continues and links to management', async () => {
    const html = await render(React.createElement(CancellationEmail, { firstName: '', endDate: '30 April 2026' }));
    expect(html).toContain('Pro access continues until');
    expect(html).toContain(URLS.subscription.replaceAll('&', '&amp;'));
    expect(html).not.toContain('Your subscription has ended and no longer provides Pro access.');
  });
  it('does not promise future access once the subscription has ended', async () => {
    const html = await render(React.createElement(CancellationEmail, { firstName: '', endDate: '30 April 2026', accessEnded: true }));
    expect(html).toContain('no longer provides Pro access');
    expect(html).not.toContain('30 April 2026');
    expect(html).toContain(URLS.pricing);
  });
});

describe('retired trial offers', () => {
  it('keeps the backup reminder consistent with paid checkout', async () => {
    const html = await render(React.createElement(Day21BackupEmail, { firstName: '' }));
    expect(html).not.toMatch(/free trial|14.day/i);
    expect(html).toContain('Your subscription starts when you upgrade');
  });
  it('blocks both legacy campaign templates before they produce sendable HTML', async () => {
    for (const template of [TrialOfferEmail, TrialOpenEmail]) {
      await expect(render(React.createElement(template, { firstName: '' }))).rejects.toThrow('retired');
    }
  });
});
