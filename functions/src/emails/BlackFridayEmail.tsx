import * as React from 'react'
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles, tone } from './components'
import {
  URLS,
  BF_YEARLY_PRICE,
  BF_YEARLY_LIST_PRICE,
  BF_LIFETIME_PRICE,
  BF_LIFETIME_LIST_PRICE,
  BF_YEARLY_CODE,
  BF_LIFETIME_CODE,
} from './facts'

export type BlackFridayVariant = 'announce' | 'reminder' | 'final'

interface BlackFridayEmailProps {
  firstName?: string
  unsubscribeUrl?: string
  variant?: BlackFridayVariant
}

// Subject and preview per send. The sender reads these so the inbox line and
// the email body can't drift apart.
export const BLACK_FRIDAY_SUBJECTS: Record<BlackFridayVariant, { subject: string; preview: string }> = {
  announce: {
    subject: 'A refreshed journal. Black Friday prices.',
    preview: `Pro for ${BF_YEARLY_PRICE} USD your first year, or Lifetime for ${BF_LIFETIME_PRICE} USD.`,
  },
  reminder: {
    subject: 'Black Friday: Pro prices end Monday',
    preview: `Yearly ${BF_YEARLY_PRICE} USD for the first year, Lifetime ${BF_LIFETIME_PRICE} USD. Ends Monday night.`,
  },
  final: {
    subject: 'Last day for Black Friday prices',
    preview: `Yearly ${BF_YEARLY_PRICE} USD and Lifetime ${BF_LIFETIME_PRICE} USD end tonight at 11:59 PM New York.`,
  },
}

const HEADINGS: Record<BlackFridayVariant, string> = {
  announce: 'Pro costs less until Monday.',
  reminder: 'Black Friday prices end Monday.',
  final: 'Black Friday prices end tonight.',
}

const proFeatures = [
  { label: 'See your full history', desc: 'Review analytics beyond the free plan’s 30-day window.' },
  { label: 'Get more from your reviews', desc: 'Use Coach FTJ, AI trade reviews, and strategy tagging.' },
  { label: 'Keep every account together', desc: 'Unlimited journal entries, trading accounts, and PropTracker accounts.' },
  { label: 'Pick up where you left off', desc: 'Sync across devices and export PDF trade reports.' },
]

// ─── Panel styles ────────────────────────────────────────────
// Charcoal price panel, same family as the Sep drop email: two plans, each
// with the list price struck and the Black Friday price beside it. Tables
// only, no flex, for Outlook.

const panel: React.CSSProperties = {
  backgroundColor: tone.heading,
  borderRadius: '14px',
  margin: '0 0 20px',
}
const panelPad: React.CSSProperties = { padding: '22px 24px' }
const panelKicker: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tone.amber,
  margin: '0 0 6px',
}
const planName: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  margin: 0,
  lineHeight: '1.3',
}
const planNote: React.CSSProperties = {
  fontSize: '13px',
  color: '#a1a1aa',
  margin: '3px 0 0',
  lineHeight: '1.4',
}
const planStruck: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 500,
  color: '#a1a1aa',
  textDecoration: 'line-through',
  margin: 0,
  lineHeight: '1',
  textAlign: 'right',
}
const planPrice: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: '#ffffff',
  margin: '4px 0 0',
  lineHeight: '1',
  textAlign: 'right',
}
const panelRule: React.CSSProperties = {
  borderTop: '1px solid #3f3f46',
  height: '1px',
  lineHeight: '1px',
  fontSize: '1px',
}

const closesStrip: React.CSSProperties = {
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  margin: '24px 0 8px',
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
const closesCity: React.CSSProperties = { fontSize: '12px', color: tone.muted, margin: '0 0 3px' }
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
  // Dark amber: plain amber on the grey chip is ~2:1 and these are the codes
  // people type when auto-apply fails.
  color: '#92400e',
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '6px',
  padding: '4px 8px',
}

function PlanRow({ name, note, list, price, first }: { name: string; note: string; list: string; price: string; first?: boolean }) {
  return (
    <>
      {!first && (
        <tr>
          <td colSpan={2} style={{ padding: '16px 0 0' }}>
            <div style={panelRule} />
          </td>
        </tr>
      )}
      <tr>
        <td style={{ padding: '16px 0 0', verticalAlign: 'bottom' }}>
          <Text style={planName}>{name}</Text>
          <Text style={planNote}>{note}</Text>
        </td>
        <td style={{ padding: '16px 0 0', verticalAlign: 'bottom' }} align="right">
          <Text style={planStruck}>{list}</Text>
          <Text style={planPrice}>{price}</Text>
        </td>
      </tr>
    </>
  )
}

// Three sends, Europe/London: announce Tue 24 Nov 10am, reminder Fri 27 Nov
// 10am, final Mon 30 Nov 6pm. The deal itself runs Mon 23 Nov to Mon 30 Nov
// 11:59 PM New York (Tue 1 Dec 4:59 AM London). Button opens /pricing on the
// yearly tab; the Lifetime card sits beside it. Pro users are not sent this.
export function BlackFridayEmail({ firstName, unsubscribeUrl, variant = 'announce' }: BlackFridayEmailProps) {
  return (
    <EmailShell
      preview={BLACK_FRIDAY_SUBJECTS[variant].preview}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions. I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Black Friday</Eyebrow>
        <Heading style={styles.h1}>{HEADINGS[variant]}</Heading>
        {variant === 'announce' && (
          <Text style={styles.paragraph}>
            {firstName ? `Hi ${firstName}. ` : ''}FreeTradeJournal just had a refresh: cleaner dashboards, easier
            trade forms, and more control over your theme.
          </Text>
        )}
        <Text style={styles.paragraph}>
          {variant === 'announce' ? 'And for Black Friday I have cut the price of Pro.' : variant === 'final' ? 'Today is the last day of the Black Friday prices.' : 'A quick reminder that Pro is on sale until Monday.'}{' '}
          Yearly is {BF_YEARLY_PRICE} USD for your first year, then {BF_YEARLY_LIST_PRICE} USD a year. Lifetime
          is {BF_LIFETIME_PRICE} USD, paid once, instead of {BF_LIFETIME_LIST_PRICE} USD.
        </Text>

        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={panel}>
          <tbody>
            <tr>
              <td style={panelPad}>
                <Text style={panelKicker}>Black Friday prices · USD</Text>
                <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
                  <tbody>
                    <PlanRow
                      first
                      name="Pro Yearly"
                      note={`First year, then ${BF_YEARLY_LIST_PRICE} USD/year`}
                      list={BF_YEARLY_LIST_PRICE}
                      price={BF_YEARLY_PRICE}
                    />
                    <PlanRow
                      name="Pro Lifetime"
                      note="One payment in USD, nothing to renew"
                      list={BF_LIFETIME_LIST_PRICE}
                      price={BF_LIFETIME_PRICE}
                    />
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <EmailButton href={URLS.pricingYearly}>See the Black Friday prices</EmailButton>
        <Text style={styles.fine}>
          The price is applied for you at checkout. If it is not, use <span style={codeChip}>{BF_YEARLY_CODE}</span> for
          Yearly or <span style={codeChip}>{BF_LIFETIME_CODE}</span> for Lifetime.
        </Text>

        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={closesStrip}>
          <tbody>
            <tr>
              <td colSpan={3}>
                <Text style={closesHead}>Ends Monday 30 November</Text>
              </td>
            </tr>
            <tr>
              <td style={closesCell}>
                <Text style={closesCity}>New York</Text>
                <Text style={closesTime}>Mon 11:59 PM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>London</Text>
                <Text style={closesTime}>Tue 4:59 AM</Text>
              </td>
              <td style={closesCell}>
                <Text style={closesCity}>Sydney</Text>
                <Text style={closesTime}>Tue 3:59 PM</Text>
              </td>
            </tr>
          </tbody>
        </table>
        <Text style={styles.fine}>
          After that both prices go back to normal and Lifetime comes off the pricing page.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ margin: '0 0 8px', fontSize: '22px', lineHeight: '1.3', fontWeight: 700, color: tone.heading }}>
          More room for your trading journal.
        </Heading>
        <Text style={{ ...styles.fine, margin: '0 0 18px' }}>Included with both Yearly and Lifetime Pro.</Text>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            {proFeatures.map((feature) => (
              <tr key={feature.label}>
                <td style={{ width: '20px', padding: '13px 10px 13px 0', verticalAlign: 'top', borderTop: `1px solid ${tone.insetBorder}`, color: '#92400e', fontSize: '16px', lineHeight: '24px' }} aria-hidden="true">✓</td>
                <td style={{ padding: '13px 0', borderTop: `1px solid ${tone.insetBorder}` }}>
                  <Text style={{ margin: '0 0 3px', fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: tone.heading }}>{feature.label}</Text>
                  <Text style={{ margin: 0, fontSize: '14px', lineHeight: '21px', color: tone.muted }}>{feature.desc}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Text style={{ ...styles.fine, margin: '12px 0 0' }}>Free accounts have a monthly AI allowance and a daily cap on automatic reviews. Pro removes both.</Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Yearly renews at {BF_YEARLY_LIST_PRICE} USD after the first year and you can cancel anytime from Settings. If it is not
          for you, nothing changes and the free journal stays free.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
