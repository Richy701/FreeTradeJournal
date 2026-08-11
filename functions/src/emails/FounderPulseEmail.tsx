import { Section, Text, Heading, Hr, Img } from '@react-email/components'
import { EmailShell, SectionLabel, styles, tone } from './components'

// Private founder stats recap — sent to Richy ONLY, never to users.
// Numbers come from PostHog (app-route activity, bot blasts filtered out)
// and Firebase Auth, assembled by functions/scripts/send-founder-pulse.ts.
// Design: Wrapped-style — one giant hero number on a full-bleed amber block,
// then proportional-bar rankings. Bars are nested-table fills (email-safe).

export interface RankedRow {
  label: string
  value: string
  /** 0..1 share of the top entry — drives the bar width. */
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
  busiestDay: string
  busiestHour: string
  busiestSession: string
  topPages: RankedRow[]
}

// ── Proportional bar list (nested-table fill, renders everywhere) ──
function BarList({ heading, note, rows }: { heading: string; note?: string; rows: RankedRow[] }) {
  return (
    <Section style={styles.content}>
      <SectionLabel>{heading}</SectionLabel>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
        <tbody>
          {rows.map((row, i) => {
            const pct = Math.max(6, Math.round((row.share ?? 0) * 100))
            return (
              <tr key={row.label}>
                <td style={{ paddingBottom: i < rows.length - 1 ? '14px' : 0 }}>
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
                    <tbody>
                      <tr>
                        <td>
                          <Text style={barLabelStyle}>{row.label}</Text>
                        </td>
                        <td style={{ textAlign: 'right' as const }}>
                          <Text style={barValueStyle}>{row.value}</Text>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ paddingTop: '6px' }}>
                          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={barTrackStyle}>
                            <tbody>
                              <tr>
                                <td width={`${pct}%`} style={{ ...barFillStyle, opacity: 1 - i * 0.14 }} />
                                <td width={`${100 - pct}%`} />
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {note && <Text style={{ ...styles.fine, margin: '14px 0 0' }}>{note}</Text>}
    </Section>
  )
}

// ── Icons (amber Phosphor PNGs — the app's icon set — hosted on Firebase Storage) ─
const ICON_BASE = 'https://storage.googleapis.com/tradevault-41c68.firebasestorage.app/email-assets/icons/v3'

// ── Delta pill (green up, red down) ───────────────────────
function DeltaPill({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const rounded = Math.round(pct)
  const up = rounded >= 0
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ display: 'inline-table' }}>
      <tbody>
        <tr>
          <td style={{
            backgroundColor: up ? '#0d2f22' : '#3a1517',
            borderRadius: '999px',
            padding: '3px 10px',
          }}>
            <Text style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 700,
              color: up ? tone.green : tone.red,
              lineHeight: '16px',
              whiteSpace: 'nowrap' as const,
            }}>
              {rounded >= 0 ? `+${rounded}%` : `${rounded}%`}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ── Bento stats: one wide hero tile, three small tiles ────
function BentoStats(props: FounderPulseEmailProps) {
  return (
    <>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'separate' as const, borderSpacing: '8px' }}>
        <tbody>
          <tr>
            <td style={heroTileStyle}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
                <tbody>
                  <tr>
                    <td>
                      <Img src={`${ICON_BASE}/users.png`} width="26" height="26" alt="" style={{ display: 'block', marginBottom: '10px' }} />
                      <Text style={heroTileValueStyle}>{props.activeUsers}</Text>
                      <Text style={heroTileLabelStyle}>Active traders this week</Text>
                    </td>
                    <td style={{ textAlign: 'right' as const, verticalAlign: 'top' }}>
                      <DeltaPill pct={props.activeUsersDeltaPct} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'separate' as const, borderSpacing: '8px' }}>
        <tbody>
          <tr>
            <td width="33%" style={smallTileStyle}>
              <Img src={`${ICON_BASE}/user-plus.png`} width="22" height="22" alt="" style={smallIconStyle} />
              <Text style={smallTileValueStyle}>{props.signups}</Text>
              <Text style={smallTileLabelStyle}>New signups</Text>
              {props.signupsDeltaPct !== null
                ? <div style={{ marginTop: '6px' }}><DeltaPill pct={props.signupsDeltaPct} /></div>
                : <Text style={smallTileSubStyle}>this week</Text>}
            </td>
            <td width="33%" style={smallTileStyle}>
              <Img src={`${ICON_BASE}/globe.png`} width="22" height="22" alt="" style={smallIconStyle} />
              <Text style={smallTileValueStyle}>{props.countriesCount}</Text>
              <Text style={smallTileLabelStyle}>Countries</Text>
              <Text style={smallTileSubStyle}>{props.countriesPrev} last week</Text>
            </td>
            <td width="33%" style={smallTileStyle}>
              <Img src={`${ICON_BASE}/identification-card.png`} width="22" height="22" alt="" style={smallIconStyle} />
              <Text style={smallTileValueStyle}>{props.totalAccounts}</Text>
              <Text style={smallTileLabelStyle}>Total accounts</Text>
              <Text style={smallTileSubStyle}>all time</Text>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export function FounderPulseEmail(props: FounderPulseEmailProps) {
  return (
    <EmailShell
      preview={`Peak ${props.peakOnline} online at once, traders in ${props.countriesCount} countries.`}
      footerNote="Private founder stats. Only you get this email."
    >
      {/* Hero — full-bleed amber, one giant number */}
      <Section style={heroStyle}>
        <Text style={heroEyebrowStyle}>Founder pulse · {props.weekLabel}</Text>
        <Heading style={heroNumberStyle}>{props.peakOnline}</Heading>
        <Text style={heroCaptionStyle}>Traders in the app at the same time</Text>
        <Text style={heroSubStyle}>
          Your peak was {props.peakOnlineWhen} — {props.peakOnlineCountries}{' '}
          {props.peakOnlineCountries === 1 ? 'country' : 'countries'} at once.
        </Text>
      </Section>

      <Section style={styles.content}>
        <BentoStats {...props} />
      </Section>

      <Hr style={styles.divider} />

      <BarList heading="Where your traders were" rows={props.topCountries} />

      <Hr style={styles.divider} />

      {/* Busiest session — big hour block */}
      <Section style={styles.content}>
        <SectionLabel>Busiest trading session</SectionLabel>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={sessionBoxStyle}>
          <tbody>
            <tr>
              <td style={sessionCellStyle}>
                <Text style={sessionHourStyle}>{props.busiestHour}</Text>
                <Text style={sessionLabelStyle}>
                  {props.busiestDay}s hit hardest, and this hour is {props.busiestSession}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={styles.divider} />

      <BarList
        heading="Most used this week"
        rows={props.topPages}
        note="Counts come from in-app activity only — landing-page bot blasts and link scanners are excluded. PostHog only sees visitors who accepted analytics, so the real numbers run a little higher."
      />
    </EmailShell>
  )
}

// ── Hero styles ───────────────────────────────────────────
const heroStyle: React.CSSProperties = {
  backgroundColor: tone.amber,
  backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%)',
  padding: '36px 32px 34px',
  textAlign: 'center' as const,
}
const heroEyebrowStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#78350f',
  margin: '0 0 6px',
}
const heroNumberStyle: React.CSSProperties = {
  fontSize: '84px',
  fontWeight: 800,
  color: tone.amberInk,
  margin: 0,
  lineHeight: '1.05',
  letterSpacing: '-0.03em',
}
const heroCaptionStyle: React.CSSProperties = {
  fontSize: '17px',
  fontWeight: 700,
  color: tone.amberInk,
  margin: '2px 0 12px',
}
const heroSubStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#78350f',
  margin: 0,
  lineHeight: '1.5',
}

// ── Bento tiles ───────────────────────────────────────────
const heroTileStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  padding: '20px 22px 18px',
}
const heroTileValueStyle: React.CSSProperties = {
  fontSize: '44px',
  fontWeight: 800,
  color: tone.amber,
  margin: '0 0 4px',
  lineHeight: '1.05',
  letterSpacing: '-0.02em',
}
const heroTileLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: tone.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: 0,
}
const smallTileStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  padding: '16px 10px 14px',
  textAlign: 'center' as const,
  verticalAlign: 'top',
}
const smallIconStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '8px',
}
const smallTileValueStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: tone.amber,
  margin: '0 0 3px',
  lineHeight: '1.1',
  letterSpacing: '-0.02em',
}
const smallTileLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: tone.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: 0,
}
const smallTileSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: tone.faint,
  margin: '6px 0 0',
}

// ── Bar list styles ───────────────────────────────────────
const barLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: tone.heading,
  margin: 0,
  lineHeight: '1.4',
}
const barValueStyle: React.CSSProperties = {
  fontSize: '13px',
  color: tone.muted,
  margin: 0,
  lineHeight: '1.4',
}
const barTrackStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  borderRadius: '999px',
  borderCollapse: 'separate' as const,
  height: '8px',
  lineHeight: '8px',
  fontSize: '1px',
}
const barFillStyle: React.CSSProperties = {
  backgroundColor: tone.amber,
  borderRadius: '999px',
  height: '8px',
  lineHeight: '8px',
  fontSize: '1px',
}

// ── Session box ───────────────────────────────────────────
const sessionBoxStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  borderCollapse: 'separate' as const,
}
const sessionCellStyle: React.CSSProperties = {
  padding: '22px 24px',
  textAlign: 'center' as const,
}
const sessionHourStyle: React.CSSProperties = {
  fontSize: '30px',
  fontWeight: 800,
  color: tone.amber,
  margin: '0 0 6px',
  lineHeight: '1.15',
  letterSpacing: '-0.02em',
}
const sessionLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: tone.body,
  margin: 0,
  lineHeight: '1.5',
}
