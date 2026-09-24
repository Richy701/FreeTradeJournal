import * as React from 'react'
import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'
import { URLS, LIFETIME_DROP_PRICE, LIFETIME_DROP_PROMO_CODE } from './facts'

interface LifetimeDropClosingEmailProps {
  firstName?: string
  unsubscribeUrl?: string
}

const codeChip: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: tone.amber,
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '6px',
  padding: '4px 8px',
}

const closesLine: React.CSSProperties = {
  ...styles.paragraph,
  color: tone.heading,
  fontWeight: 600,
}

// Closing reminder for the lifetime drop. Sent Thu 1 Oct 2026 at 9:30 AM
// New York, the day BEFORE the deadline (in August the final day converted
// nobody, the day before did). Short and plain. Only goes to people who got
// the drop email and have not been in the app since it went out; everyone
// else has seen the in-app strip. Lifetime owners, including this week's
// buyers, are skipped by the send.
export function LifetimeDropClosingEmail({ firstName, unsubscribeUrl }: LifetimeDropClosingEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro at ${LIFETIME_DROP_PRICE} closes tomorrow night, New York time.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Lifetime Pro closes tomorrow night.</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, this` : 'This'} is the one reminder I said I would send. Lifetime Pro is{' '}
          {LIFETIME_DROP_PRICE} until Friday 2 October at 11:59 PM New York. That is 4:59 AM Saturday in London and 1:59 PM
          Saturday in Sydney. One payment, every Pro feature, nothing to renew.
        </Text>
        <Text style={styles.paragraph}>
          After that it comes off the pricing page and the code <span style={codeChip}>{LIFETIME_DROP_PROMO_CODE}</span> stops
          working. I do not have a date for the next one.
        </Text>

        <EmailButton href={URLS.lifetimeDropBuy}>Get Lifetime Pro for {LIFETIME_DROP_PRICE}</EmailButton>

        <Text style={{ ...closesLine, marginTop: '24px' }}>
          Closes Friday 2 October, 11:59 PM New York.
        </Text>
        <Text style={styles.paragraph}>
          If it is not for you, nothing changes. The free journal stays free and this is the last email about it.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
