import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles, tone } from './components'
import { URLS, BIRTHDAY_LIFETIME_PRICE, BIRTHDAY_PROMO_CODE } from './facts'

interface BirthdayLifetimeEmailProps {
  firstName?: string
  unsubscribeUrl?: string
}

const lifetimeFeatures = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your whole trading history, not just the last 30 days.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts and strategy tagging with no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'Unlimited everything else', desc: 'Journal entries, trading accounts, PropTracker accounts and PDF reports.' },
]

// ─── Birthday-only styles ────────────────────────────────────
// This send gets its own look: an amber hero band (every other email is
// dark-on-dark), a price panel, and a closing-time strip. Tables only, no
// flex, for Outlook.

const hero: React.CSSProperties = {
  backgroundColor: tone.amber,
  padding: '36px 32px 32px',
}
const heroKicker: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tone.amberInk,
  opacity: 0.7,
  margin: '0 0 10px',
}
const heroNumber: React.CSSProperties = {
  fontSize: '96px',
  lineHeight: '0.9',
  fontWeight: 800,
  letterSpacing: '-0.04em',
  color: tone.amberInk,
  margin: '0 0 8px',
}
const heroTitle: React.CSSProperties = {
  fontSize: '22px',
  lineHeight: '1.3',
  fontWeight: 700,
  color: tone.amberInk,
  margin: '0 0 6px',
  letterSpacing: '-0.01em',
}
const heroSub: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: tone.amberInk,
  opacity: 0.75,
  margin: 0,
}

const pricePanel: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.amber}`,
  borderRadius: '12px',
  padding: '24px 24px 20px',
  margin: '0 0 20px',
}
const priceLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tone.amber,
  margin: '0 0 12px',
}
const priceWas: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: tone.faint,
  textDecoration: 'line-through',
  margin: 0,
  lineHeight: '1',
  paddingRight: '14px',
}
const priceNow: React.CSSProperties = {
  fontSize: '52px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: tone.heading,
  margin: 0,
  lineHeight: '1',
}
const priceNote: React.CSSProperties = {
  fontSize: '14px',
  color: tone.body,
  margin: '12px 0 0',
  lineHeight: '1.5',
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

// First-birthday send, 28 Aug 2026: lifetime back for one week at $199.
// Standalone by Richy's call: no product news bundled in, no user or sales
// numbers. Lifetime owners are skipped by the send script.
export function BirthdayLifetimeEmail({ firstName, unsubscribeUrl }: BirthdayLifetimeEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro is back for one week at ${BIRTHDAY_LIFETIME_PRICE}. Closes Friday 4 September.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      {/* Hero band */}
      <Section style={hero}>
        <Text style={heroKicker}>28 August 2025 to 28 August 2026</Text>
        <Text style={heroNumber}>1</Text>
        <Text style={heroTitle}>FreeTradeJournal is one year old today.</Text>
        <Text style={heroSub}>
          {firstName ? `${firstName}, thank you for being part of the first year.` : 'Thank you for being part of the first year.'}
        </Text>
      </Section>

      <Section style={styles.content}>
        <Heading style={styles.h1}>Lifetime Pro is back for one week.</Heading>
        <Text style={styles.paragraph}>
          Lifetime came off sale on the 7th of August. For the birthday week it is back. Pay once and you get every Pro feature for good, including anything I add later.
        </Text>

        {/* Price panel */}
        <Section style={pricePanel}>
          <Text style={priceLabel}>Birthday price</Text>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'baseline' }}>
                  <Text style={priceNow}>{BIRTHDAY_LIFETIME_PRICE}</Text>
                </td>
                <td style={{ verticalAlign: 'baseline', paddingLeft: '14px' }}>
                  <Text style={priceWas}>$249</Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Text style={priceNote}>
            One payment. No renewal, ever. The price is applied for you at checkout; if it is not, use <span style={codeChip}>{BIRTHDAY_PROMO_CODE}</span>
          </Text>
        </Section>

        <EmailButton href={URLS.pricing}>Get Lifetime Pro for {BIRTHDAY_LIFETIME_PRICE}</EmailButton>

        {/* Closing time strip */}
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ ...closesStrip, marginTop: '24px' }}>
          <tbody>
            <tr>
              <td colSpan={3}>
                <Text style={closesHead}>Closes Friday 4 September</Text>
              </td>
            </tr>
            <tr>
              <td style={closesCell}>
                <Text style={closesCity}>London</Text>
                <Text style={closesTime}>Sat 12:59 AM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>New York</Text>
                <Text style={closesTime}>Fri 7:59 PM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>Sydney</Text>
                <Text style={closesTime}>Sat 9:59 AM</Text>
              </td>
            </tr>
          </tbody>
        </table>
        <Text style={styles.fine}>
          That is 11:59 PM UTC. After it the plan comes off the pricing page again and the code stops working.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What lifetime Pro includes" items={lifetimeFeatures} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          If you are on a monthly or yearly plan, buying lifetime replaces it and the subscription stops. If lifetime is not for you, nothing changes and the free journal stays free. This is the only email about the offer.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
