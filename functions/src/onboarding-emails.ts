export const ONBOARDING_SUBJECTS = {
  entry: 'Add one trade or import your history',
  support: 'Need a hand with your trading journal?',
  review: 'Trade logged. What did you learn?',
} as const

export function firstTradeReviewEligible(data: {
  email?: string; emailOptOut?: boolean; signupThrottled?: boolean;
  firstTradeLoggedAt?: { toMillis(): number }; firstTradeReviewSentAt?: unknown;
}, now: number): boolean {
  const firstTrade = data.firstTradeLoggedAt?.toMillis()
  return !!data.email && !data.emailOptOut && !data.signupThrottled && !data.firstTradeReviewSentAt
    && firstTrade !== undefined && now - firstTrade >= 86400000 && now - firstTrade < 172800000
}

// Staged replacement, not a provider write. Publish the revised templates
// before applying this to the existing activation automation. Preserve its ID.
// The application owns the first-trade follow-up; do not add a hosted duplicate.
export function activationWorkflow(entryTemplateId: string, supportTemplateId: string) {
  const send = (key: string, subject: string, id: string) => ({ key, type: 'send_email', config: {
    from: 'FreeTradeJournal <hello@freetradejournal.com>', subject,
    template: { id, variables: { NAME: { var: 'contact.first_name' } } },
  } })
  const condition = (key: string) => ({ key, type: 'condition', config: {
    type: 'rule', field: 'contact.has_logged_trade', value: 'true', operator: 'neq',
  } })
  return {
    steps: [
      { key: 'trigger', type: 'trigger', config: { event_name: 'user.signed_up' } },
      { key: 'wait_entry', type: 'wait_for_event', config: { event_name: 'trade.logged', timeout: '2 days' } },
      condition('check_entry'), send('entry', ONBOARDING_SUBJECTS.entry, entryTemplateId),
      { key: 'wait_support', type: 'wait_for_event', config: { event_name: 'trade.logged', timeout: '5 days' } },
      condition('check_support'), send('support', ONBOARDING_SUBJECTS.support, supportTemplateId),
    ],
    connections: [
      { from: 'trigger', to: 'wait_entry', type: 'default' },
      { from: 'wait_entry', to: 'check_entry', type: 'timeout' },
      { from: 'check_entry', to: 'entry', type: 'condition_met' },
      { from: 'entry', to: 'wait_support', type: 'default' },
      { from: 'wait_support', to: 'check_support', type: 'timeout' },
      { from: 'check_support', to: 'support', type: 'condition_met' },
    ],
  }
}
