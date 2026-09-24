import * as React from 'react'
import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles, tone } from './components'
import { URLS, LIFETIME_DROP_PRICE, LIFETIME_DROP_LIST_PRICE } from './facts'

interface LifetimeDropTeaserEmailProps {
  firstName?: string
  unsubscribeUrl?: string
}

// ─── Teaser-only styles ──────────────────────────────────────
// Mostly whitespace, one big time, and the offer stated plainly underneath.
// Tables only, no flex, for Outlook.

const bigTime: React.CSSProperties = {
  fontSize: '56px',
  lineHeight: '1',
  fontWeight: 800,
  letterSpacing: '-0.04em',
  color: tone.heading,
  margin: '0 0 6px',
}
const bigTimeSub: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: tone.muted,
  margin: '0 0 28px',
}

const offerPanel: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.amber}`,
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const offerLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tone.amber,
  margin: '0 0 10px',
}
const offerNow: React.CSSProperties = {
  fontSize: '40px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: tone.heading,
  margin: 0,
  lineHeight: '1',
}
const offerWas: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: tone.faint,
  textDecoration: 'line-through',
  margin: 0,
  lineHeight: '1',
}
const offerNote: React.CSSProperties = {
  fontSize: '14px',
  color: tone.body,
  margin: '10px 0 0',
  lineHeight: '1.5',
}

const cityTable: React.CSSProperties = {
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  margin: '0 0 8px',
}
const cityHead: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tone.muted,
  margin: 0,
  padding: '14px 18px 0',
}
const cityCell: React.CSSProperties = {
  padding: '10px 18px 16px',
  verticalAlign: 'top',
  width: '33%',
}
const cityName: React.CSSProperties = {
  fontSize: '12px',
  color: tone.muted,
  margin: '0 0 3px',
}
const cityTime: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: tone.heading,
  margin: 0,
  lineHeight: '1.3',
}

// Sent Thu 24 Sep 2026, the day before the lifetime drop. Says exactly what
// is coming and when, so nobody has to guess. Owns the September "you will
// not hear about this again" line instead of pretending it was never said.
// No product news, no numbers. Lifetime owners are skipped by the send.
export function LifetimeDropTeaserEmail({ firstName, unsubscribeUrl }: LifetimeDropTeaserEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro is back tomorrow at 9:30 AM New York: ${LIFETIME_DROP_PRICE} for one week, then gone.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow quiet>Tomorrow</Eyebrow>
        <Text style={bigTime}>9:30 AM</Text>
        <Text style={bigTimeSub}>New York time, Friday 25 September</Text>

        <Heading style={styles.h1}>Lifetime Pro is back for one week.</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, tomorrow` : 'Tomorrow'} at 9:30 AM New York, Lifetime Pro goes back on the pricing page.
          Pay once and keep every Pro feature for good, including anything I add later. Nothing to renew. It stays open
          for one week, then comes off again.
        </Text>

        <Section style={offerPanel}>
          <Text style={offerLabel}>From tomorrow, 9:30 AM New York</Text>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'baseline' }}>
                  <Text style={offerNow}>{LIFETIME_DROP_PRICE}</Text>
                </td>
                <td style={{ verticalAlign: 'baseline', paddingLeft: '12px' }}>
                  <Text style={offerWas}>{LIFETIME_DROP_LIST_PRICE}</Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Text style={offerNote}>One payment. No renewal, ever. Closes Friday 2 October at 11:59 PM New York.</Text>
        </Section>

        <EmailButton href={URLS.lifetimeDrop}>See the drop</EmailButton>
        <Text style={styles.fine}>
          The page has the full details and a live clock. At 9:30 it turns into the checkout, and you will get one more email
          at that moment.
        </Text>

        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ ...cityTable, marginTop: '24px' }}>
          <tbody>
            <tr>
              <td colSpan={3}>
                <Text style={cityHead}>Opens Friday 25 September</Text>
              </td>
            </tr>
            <tr>
              <td style={cityCell}>
                <Text style={cityName}>New York</Text>
                <Text style={cityTime}>Fri 9:30 AM</Text>
              </td>
              <td style={cityCell}>
                <Text style={cityName}>London</Text>
                <Text style={cityTime}>Fri 2:30 PM</Text>
              </td>
              <td style={cityCell}>
                <Text style={cityName}>Sydney</Text>
                <Text style={cityTime}>Fri 11:30 PM</Text>
              </td>
            </tr>
          </tbody>
        </table>

        <Text style={{ ...styles.paragraph, marginTop: '28px' }}>
          In September I said you would not hear about this again. I am breaking that once, with a day&apos;s notice, so
          nobody finds out after it has closed. If it is not for you, nothing changes and the free journal stays free.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
