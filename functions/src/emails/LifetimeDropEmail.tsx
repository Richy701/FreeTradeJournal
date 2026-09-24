import * as React from 'react'
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles, tone } from './components'
import { URLS, LIFETIME_DROP_PRICE, LIFETIME_DROP_LIST_PRICE, LIFETIME_DROP_PROMO_CODE } from './facts'

interface LifetimeDropEmailProps {
  firstName?: string
  unsubscribeUrl?: string
}

const lifetimeFeatures = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your whole trading history, not just the last 30 days.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts and strategy tagging with no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'Unlimited everything else', desc: 'Journal entries, trading accounts, PropTracker accounts and PDF reports.' },
]

// ─── Drop-only styles ────────────────────────────────────────
// The reveal. A charcoal receipt panel instead of last time's amber hero:
// line items, a struck list price, the drop price in the biggest type in the
// email. Tables only, no flex, for Outlook.

const receipt: React.CSSProperties = {
  backgroundColor: tone.heading,
  borderRadius: '14px',
  margin: '0 0 20px',
}
const receiptPad: React.CSSProperties = {
  padding: '22px 24px',
}
const receiptKicker: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tone.amber,
  margin: '0 0 14px',
}
const receiptRowLabel: React.CSSProperties = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: 0,
  lineHeight: '1.4',
}
const receiptRowValue: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
  margin: 0,
  lineHeight: '1.4',
  textAlign: 'right',
}
const receiptStruck: React.CSSProperties = {
  ...receiptRowValue,
  color: '#a1a1aa',
  textDecoration: 'line-through',
  fontWeight: 500,
}
const receiptRule: React.CSSProperties = {
  borderTop: '1px solid #3f3f46',
  height: '1px',
  lineHeight: '1px',
  fontSize: '1px',
}
const receiptTotalLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#ffffff',
  margin: 0,
}
const receiptTotal: React.CSSProperties = {
  fontSize: '54px',
  fontWeight: 800,
  letterSpacing: '-0.04em',
  color: '#ffffff',
  margin: 0,
  lineHeight: '1',
  textAlign: 'right',
}

const closesStrip: React.CSSProperties = {
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  margin: '0 0 8px',
}
const closesHead: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tone.muted,
  margin: 0,
  padding: '14px 18px 0',
}
const closesCell: React.CSSProperties = {
  padding: '10px 18px 16px',
  verticalAlign: 'top',
  width: '33%',
}
const closesCity: React.CSSProperties = {
  fontSize: '12px',
  color: tone.muted,
  margin: '0 0 3px',
}
const closesTime: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: tone.heading,
  margin: 0,
  lineHeight: '1.3',
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

function ReceiptRow({ label, value, struck }: { label: string; value: string; struck?: boolean }) {
  return (
    <tr>
      <td style={{ padding: '7px 0' }}>
        <Text style={receiptRowLabel}>{label}</Text>
      </td>
      <td style={{ padding: '7px 0' }} align="right">
        <Text style={struck ? receiptStruck : receiptRowValue}>{value}</Text>
      </td>
    </tr>
  )
}

// Sent Fri 25 Sep 2026 at 9:30 AM New York, the moment the drop opens. The
// button deep-links to the drop page with ?buy=1 so one click goes straight
// into checkout. No product news, no numbers. Lifetime owners are skipped.
export function LifetimeDropEmail({ firstName, unsubscribeUrl }: LifetimeDropEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro is back at ${LIFETIME_DROP_PRICE} for one week. Closes Friday 2 October, 11:59 PM New York.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Doors open</Eyebrow>
        <Heading style={styles.h1}>Lifetime Pro is back. One week.</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, it` : 'It'} is 9:30 in New York and the doors are open. Lifetime Pro is back on the
          pricing page at {LIFETIME_DROP_PRICE} instead of {LIFETIME_DROP_LIST_PRICE}. Pay once and keep every Pro feature for
          good, including anything I add later. Nothing to renew.
        </Text>

        {/* Receipt panel */}
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={receipt}>
          <tbody>
            <tr>
              <td style={receiptPad}>
                <Text style={receiptKicker}>The drop</Text>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
                  <tbody>
                    <ReceiptRow label="Lifetime Pro, list price" value={LIFETIME_DROP_LIST_PRICE} struck />
                    <ReceiptRow label="Drop price" value={LIFETIME_DROP_PRICE} />
                    <ReceiptRow label="Renewals" value="None" />
                    <ReceiptRow label="Closes" value="Fri 2 Oct, 11:59 PM NY" />
                    <tr>
                      <td colSpan={2} style={{ padding: '12px 0 0' }}>
                        <div style={receiptRule} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '18px 0 0', verticalAlign: 'bottom' }}>
                        <Text style={receiptTotalLabel}>You pay, once</Text>
                      </td>
                      <td style={{ padding: '18px 0 0', verticalAlign: 'bottom' }} align="right">
                        <Text style={receiptTotal}>{LIFETIME_DROP_PRICE}</Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <EmailButton href={URLS.lifetimeDropBuy}>Get Lifetime Pro for {LIFETIME_DROP_PRICE}</EmailButton>
        <Text style={styles.fine}>
          The price is applied for you at checkout. If it is not, use <span style={codeChip}>{LIFETIME_DROP_PROMO_CODE}</span>
        </Text>

        {/* Closing time strip */}
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ ...closesStrip, marginTop: '24px' }}>
          <tbody>
            <tr>
              <td colSpan={3}>
                <Text style={closesHead}>Closes Friday 2 October</Text>
              </td>
            </tr>
            <tr>
              <td style={closesCell}>
                <Text style={closesCity}>New York</Text>
                <Text style={closesTime}>Fri 11:59 PM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>London</Text>
                <Text style={closesTime}>Sat 4:59 AM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>Sydney</Text>
                <Text style={closesTime}>Sat 1:59 PM</Text>
              </td>
            </tr>
          </tbody>
        </table>
        <Text style={styles.fine}>
          After that the plan comes off the pricing page again and the code stops working.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What Lifetime Pro includes" items={lifetimeFeatures} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          If you are on a monthly or yearly plan, buying Lifetime replaces it and the subscription stops. If it is not for
          you, nothing changes and the free journal stays free. One more email the day before it closes, then nothing.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
