import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text,
  Hr, Link, Preview, Font,
} from '@react-email/components'
import { URLS } from './facts'

// ─── Design tokens ──────────────────────────────────────────
// Refined-dark card system: near-black page, elevated card, amber accent.
// All text colors pass 4.5:1 on the card background.

export const tone = {
  page: '#0f0f10',
  card: '#17181a',
  cardBorder: '#26272b',
  inset: '#1d1e21',
  insetBorder: '#2b2c31',
  divider: '#232327',
  heading: '#f5f5f6',
  body: '#b6b6bd',
  muted: '#8b8b93',
  faint: '#6e6e76',
  amber: '#f59e0b',
  amberInk: '#1a1305',
  green: '#34d399',
  red: '#f87171',
}

const fontStack = "Inter, -apple-system, 'Segoe UI', Arial, sans-serif"

// ─── Text styles ────────────────────────────────────────────

export const styles = {
  h1: {
    fontSize: '25px',
    fontWeight: 700,
    color: tone.heading,
    margin: '0 0 14px',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  paragraph: {
    fontSize: '15px',
    color: tone.body,
    lineHeight: '1.6',
    margin: '0 0 16px',
  } as React.CSSProperties,
  strong: {
    color: tone.heading,
  } as React.CSSProperties,
  fine: {
    fontSize: '13px',
    color: tone.muted,
    lineHeight: '1.6',
    margin: '16px 0 0',
  } as React.CSSProperties,
  content: {
    padding: '28px 32px',
  } as React.CSSProperties,
  divider: {
    borderColor: tone.divider,
    margin: 0,
  } as React.CSSProperties,
}

// ─── Shell ──────────────────────────────────────────────────

interface EmailShellProps {
  preview: string
  children: React.ReactNode
  /** Signed per-user unsubscribe URL. Omit on transactional emails. */
  unsubscribeUrl?: string
  /** Overrides the default sign-off line above the footer links. */
  footerNote?: string
}

export function EmailShell({ preview, children, unsubscribeUrl, footerNote }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={pageStyle}>
        <Container style={containerStyle}>

          <Section style={cardStyle}>
            {/* Brand header — table layout, no flex (Outlook) */}
            <Section style={headerStyle}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Img src={URLS.logo} width="26" height="26" alt="FreeTradeJournal" style={logoStyle} />
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingLeft: '10px' }}>
                      <Text style={brandStyle}>FreeTradeJournal</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr style={styles.divider} />

            {children}
          </Section>

          {/* Footer sits on the page, outside the card */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {footerNote || 'Richy from FreeTradeJournal. Reply if you have questions — I read every one.'}
            </Text>
            <Text style={footerLinksStyle}>
              <Link href={URLS.privacy} style={footerLinkStyle}>Privacy</Link>
              {' · '}
              <Link href={URLS.terms} style={footerLinkStyle}>Terms</Link>
              {unsubscribeUrl && (
                <>
                  {' · '}
                  <Link href={unsubscribeUrl} style={footerLinkStyle}>Unsubscribe</Link>
                </>
              )}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const pageStyle: React.CSSProperties = {
  backgroundColor: tone.page,
  fontFamily: fontStack,
  margin: 0,
  padding: '32px 12px',
}
const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
}
const cardStyle: React.CSSProperties = {
  backgroundColor: tone.card,
  border: `1px solid ${tone.cardBorder}`,
  borderRadius: '12px',
  overflow: 'hidden',
}
const headerStyle: React.CSSProperties = {
  padding: '20px 32px',
}
const logoStyle: React.CSSProperties = {
  borderRadius: '6px',
  display: 'block',
}
const brandStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  color: tone.heading,
  lineHeight: '26px',
}
const footerStyle: React.CSSProperties = {
  padding: '20px 24px 0',
  textAlign: 'center' as const,
}
const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: tone.faint,
  lineHeight: '1.6',
  margin: '0 0 8px',
}
const footerLinksStyle: React.CSSProperties = {
  fontSize: '12px',
  color: tone.faint,
  margin: 0,
}
const footerLinkStyle: React.CSSProperties = {
  color: tone.muted,
  textDecoration: 'underline',
}

// ─── Eyebrow badge ──────────────────────────────────────────

export function Eyebrow({ children, quiet }: { children: React.ReactNode; quiet?: boolean }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: '16px' }}>
      <tbody>
        <tr>
          <td style={{
            backgroundColor: quiet ? tone.inset : '#2a2113',
            borderRadius: '999px',
            padding: '4px 12px',
          }}>
            <Text style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: quiet ? tone.muted : tone.amber,
              lineHeight: '16px',
            }}>
              {children}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── Bulletproof button ─────────────────────────────────────

export function EmailButton({ href, children, variant = 'primary' }: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const primary = variant === 'primary'
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              backgroundColor: primary ? tone.amber : tone.inset,
              borderRadius: '8px',
              border: primary ? `1px solid ${tone.amber}` : `1px solid ${tone.insetBorder}`,
            }}
          >
            <a
              href={href}
              target="_blank"
              style={{
                display: 'inline-block',
                padding: '12px 26px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: fontStack,
                color: primary ? tone.amberInk : tone.heading,
                textDecoration: 'none',
                lineHeight: '20px',
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── Section label ──────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      fontSize: '11px',
      fontWeight: 700,
      color: tone.amber,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      margin: '0 0 18px',
    }}>
      {children}
    </Text>
  )
}

// ─── Feature list (title + description rows) ────────────────

export interface Feature {
  label: string
  desc: string
}

export function FeatureList({ heading, items }: { heading: string; items: Feature[] }) {
  return (
    <Section style={styles.content}>
      <SectionLabel>{heading}</SectionLabel>
      {items.map((f, i) => (
        <React.Fragment key={f.label}>
          <Text style={featureTitleStyle}>{f.label}</Text>
          <Text style={featureDescStyle}>{f.desc}</Text>
          {i < items.length - 1 && <Hr style={featureDividerStyle} />}
        </React.Fragment>
      ))}
    </Section>
  )
}

const featureTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: tone.heading,
  margin: '0 0 4px',
}
const featureDescStyle: React.CSSProperties = {
  fontSize: '13px',
  color: tone.muted,
  lineHeight: '1.6',
  margin: 0,
}
const featureDividerStyle: React.CSSProperties = {
  borderColor: tone.divider,
  margin: '14px 0',
}

// ─── Numbered steps ─────────────────────────────────────────

export function NumberedSteps({ heading, steps }: { heading: string; steps: string[] }) {
  return (
    <Section style={styles.content}>
      <SectionLabel>{heading}</SectionLabel>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%">
        <tbody>
          {steps.map((step, i) => (
            <tr key={step}>
              <td style={{ verticalAlign: 'top', width: '32px', paddingBottom: i < steps.length - 1 ? '14px' : 0 }}>
                <Text style={stepNumStyle}>{String(i + 1).padStart(2, '0')}</Text>
              </td>
              <td style={{ verticalAlign: 'top', paddingBottom: i < steps.length - 1 ? '14px' : 0 }}>
                <Text style={stepTextStyle}>{step}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

const stepNumStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: tone.amber,
  margin: 0,
  lineHeight: '21px',
}
const stepTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: tone.body,
  lineHeight: '1.5',
  margin: 0,
}

// ─── Stat grid (weekly digest) ──────────────────────────────

export interface Stat {
  value: string
  label: string
  /** 'up' renders green, 'down' renders red, default is heading color */
  toneHint?: 'up' | 'down'
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  const rows: Stat[][] = []
  for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2))
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ borderCollapse: 'separate' as const, borderSpacing: '8px' }}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((s) => (
              <td key={s.label} width="50%" style={statCellStyle}>
                <Text style={{
                  ...statValueStyle,
                  color: s.toneHint === 'up' ? tone.green : s.toneHint === 'down' ? tone.red : tone.heading,
                }}>
                  {s.value}
                </Text>
                <Text style={statLabelStyle}>{s.label}</Text>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const statCellStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '10px',
  padding: '18px 12px',
  textAlign: 'center' as const,
}
const statValueStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  margin: '0 0 2px',
  lineHeight: '1.2',
}
const statLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: tone.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: 0,
}
