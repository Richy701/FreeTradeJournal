import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, SectionLabel, styles, tone, numberFont } from './components'

export interface RankedRow {
  label: string
  value: string
  share?: number
}

export interface FounderPulseEmailProps {
  weekLabel: string
  peakOnline: number
  peakOnlineWhen: string
  peakOnlineCountries: number
  activeUsers: number
  activeUsersDeltaPct: number | null
  signups: number
  signupsDeltaPct: number | null
  totalAccounts: number
  countriesCount: number
  countriesPrev: number
  topCountries: RankedRow[]
  busiestDay: string | null
  busiestHour: string | null
  topPages: RankedRow[]
}

function delta(value: number | null): string {
  return value === null ? 'No comparison available' : `${value >= 0 ? '+' : ''}${Math.round(value)}% versus previous week`
}

function PulseMetric({ label, value, comparison }: { label: string; value: number; comparison: string }) {
  return <tr>
    <td width="65%" style={{ padding: '14px 12px 14px 0', borderBottom: `1px solid ${tone.divider}`, verticalAlign: 'top' }}>
      <Text style={{ ...styles.paragraph, margin: '0 0 2px', fontWeight: 600, color: tone.heading }}>{label}</Text>
      <Text style={{ ...styles.fine, margin: 0 }}>{comparison}</Text>
    </td>
    <td width="35%" style={{ padding: '14px 0', borderBottom: `1px solid ${tone.divider}`, verticalAlign: 'top', textAlign: 'right' }}>
      <Text style={{ ...styles.paragraph, fontFamily: numberFont, fontSize: '24px', lineHeight: '1.3', fontWeight: 700, color: tone.heading, margin: 0, overflowWrap: 'anywhere' }}>{value.toLocaleString('en-US')}</Text>
    </td>
  </tr>
}

function Rankings({ heading, rows }: { heading: string; rows: RankedRow[] }) {
  return <Section className="email-content" style={styles.content}>
    <SectionLabel>{heading}</SectionLabel>
    {rows.length === 0 ? <Text style={{ ...styles.paragraph, margin: 0 }}>No activity recorded.</Text> : rows.map(row => {
      const share = Number.isFinite(row.share) ? Math.min(100, Math.max(0, Math.round(row.share! * 100))) : 0
      return <Section key={row.label} style={{ paddingBottom: '16px' }}>
        <Text style={{ ...styles.paragraph, margin: '0 0 6px' }}><strong>{row.label}</strong> · {row.value}</Text>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: tone.inset, tableLayout: 'fixed' }}><tbody><tr>
          {share > 0 && <td width={`${share}%`} height="6" style={{ backgroundColor: tone.amber, fontSize: 0, lineHeight: 0 }} />}
          {share < 100 && <td width={`${100 - share}%`} height="6" />}
        </tr></tbody></table>
      </Section>
    })}
  </Section>
}

export function FounderPulseEmail(props: FounderPulseEmailProps) {
  return <EmailShell preview={`${props.activeUsers} active visitors; ${props.signups} signup events. ${props.weekLabel}.`} footerNote="Internal report · Firebase Auth and PostHog">
    <Section className="email-content" style={styles.content}>
      <Heading style={{ ...styles.h1, marginBottom: '8px' }}>Founder pulse</Heading>
      {props.weekLabel && <Text style={{ ...styles.fine, margin: '0 0 8px' }}>{props.weekLabel}</Text>}
      <Text style={styles.paragraph}><strong style={styles.strong}>{props.activeUsers.toLocaleString('en-US')} active visitors. {props.signups.toLocaleString('en-US')} signup events.</strong><br />Recorded over seven full UTC days. Weekly comparisons are shown below.</Text>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ tableLayout: 'fixed' }}><tbody>
      <PulseMetric label="Active visitors" value={props.activeUsers} comparison={delta(props.activeUsersDeltaPct)} />
      <PulseMetric label="Signup events" value={props.signups} comparison={delta(props.signupsDeltaPct)} />
      <PulseMetric label="Countries reached" value={props.countriesCount} comparison={`${props.countriesPrev} in the previous week`} />
      <PulseMetric label="Total accounts" value={props.totalAccounts} comparison="All-time Firebase Auth total" />
      </tbody></table>
      <Text style={styles.fine}><strong style={styles.strong}>Read these separately:</strong> visitor and signup counts measure different events; they are not a conversion rate.</Text>
    </Section>
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <SectionLabel>Peak five-minute activity</SectionLabel>
      <Text style={{ ...styles.paragraph, margin: 0 }}>{props.peakOnline > 0 ? `${props.peakOnline} distinct visitors were active within one five-minute window ${props.peakOnlineWhen}, across ${props.peakOnlineCountries} countries.` : 'No qualifying activity window recorded.'}</Text>
      <Text style={styles.fine}>This is not a simultaneous online count. The peak excludes windows with more than 12 visitors from a single country; that filter may also exclude genuine activity.</Text>
    </Section>
    <Hr style={styles.divider} />
    <Rankings heading="Countries by active visitors" rows={props.topCountries} />
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <SectionLabel>Activity timing</SectionLabel>
      <Text style={styles.paragraph}><strong>Busiest day:</strong> {props.busiestDay ?? 'No activity recorded'}</Text>
      <Text style={{ ...styles.paragraph, margin: 0 }}><strong>Busiest hour:</strong> {props.busiestHour ?? 'No activity recorded'}</Text>
      <Text style={styles.fine}>Day and hour are ranked separately by distinct visitors across the week. They do not identify one combined session.</Text>
    </Section>
    <Hr style={styles.divider} />
    <Rankings heading="Pages by active visitors" rows={props.topPages} />
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <Text style={{ ...styles.fine, margin: 0 }}>Activity counts use PostHog identifiers on selected app routes and depend on analytics collection. They are not verified trader counts. Signup events come from PostHog; account totals come from Firebase Auth. Route filtering excludes landing-page traffic, but does not prove all remaining activity is human.</Text>
    </Section>
  </EmailShell>
}
