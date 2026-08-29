import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'
import { URLS, BIRTHDAY_LIFETIME_PRICE, BIRTHDAY_PROMO_CODE } from './facts'

interface BirthdayLifetimeClosingEmailProps {
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

// Closing reminder for the birthday lifetime week. Proposed send: Thu 3 Sep
// 2026, 14:00 London (the day BEFORE the deadline; in August the last day
// itself converted nobody, the day before did). Deliberately short and plain:
// the 28 Aug email promised it was the only one about the offer, so this one
// says so up front instead of pretending otherwise. No product news, no
// numbers. Lifetime owners and anyone who bought since are skipped by the send.
export function BirthdayLifetimeClosingEmail({ firstName, unsubscribeUrl }: BirthdayLifetimeClosingEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro at ${BIRTHDAY_LIFETIME_PRICE} closes tomorrow night.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Lifetime Pro closes tomorrow night.</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, last` : 'Last'} week I said the birthday email would be the only one about this. I am breaking that once, because the deadline is close and I would rather you hear it from me than miss it.
        </Text>
        <Text style={styles.paragraph}>
          Lifetime Pro is {BIRTHDAY_LIFETIME_PRICE} until Friday 4 September, 11:59 PM UTC. That is 7:59 PM in New York and 12:59 AM Saturday in London. One payment, every Pro feature, nothing to renew.
        </Text>
        <Text style={styles.paragraph}>
          After that it comes off the pricing page and the code <span style={codeChip}>{BIRTHDAY_PROMO_CODE}</span> stops working. I do not have a date for bringing it back.
        </Text>

        <EmailButton href={URLS.pricing}>Get Lifetime Pro for {BIRTHDAY_LIFETIME_PRICE}</EmailButton>

        <Text style={{ ...closesLine, marginTop: '24px' }}>
          Closes Friday 4 September, 11:59 PM UTC.
        </Text>
        <Text style={styles.paragraph}>
          If it is not for you, nothing changes. The free journal stays free and you will not hear about this offer again.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
