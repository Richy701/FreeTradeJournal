import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text,
  Hr, Link, Preview,
} from '@react-email/components'
import { URLS } from './facts'

// ─── Design tokens ──────────────────────────────────────────
// Product email system: neutral surfaces, charcoal type, FTJ amber actions.
// Main copy and supporting copy use separate, readable text weights.

export const tone = {
  page: '#f3f4f6',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  inset: '#f3f4f6',
  insetBorder: '#e5e7eb',
  divider: '#e5e7eb',
  heading: '#18181b',
  body: '#3f3f46',
  muted: '#52525b',
  faint: '#71717a',
  amber: '#f59e0b',
  amberInk: '#1a1305',
  green: '#196e4b',
  red: '#a63330',
}

const fontStack = "Inter, -apple-system, 'Segoe UI', Arial, sans-serif"

// ─── Text styles ────────────────────────────────────────────

export const styles = {
  h1: {
    fontSize: '34px',
    fontFamily: fontStack,
    fontWeight: 700,
    color: tone.heading,
    margin: '0 0 16px',
    lineHeight: '1.15',
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  paragraph: {
    fontSize: '16px',
    color: tone.body,
    lineHeight: '1.6',
    margin: '0 0 16px',
  } as React.CSSProperties,
  strong: {
    color: tone.heading,
  } as React.CSSProperties,
  fine: {
    fontSize: '14px',
    color: tone.muted,
    lineHeight: '1.6',
    margin: '16px 0 0',
  } as React.CSSProperties,
  content: {
    padding: '36px 24px',
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
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @media only screen and (max-width: 479px) {
            .email-content, .email-header { padding-left: 20px !important; padding-right: 20px !important; }
            .email-page-content { padding: 16px 8px !important; }
            .email-content h1 { font-size: 28px !important; }
            .email-feature-cell { display: block !important; width: auto !important; padding: 20px 0 !important; }
          }
          @media only screen and (min-width: 480px) {
            .email-content, .email-header { padding-left: 32px !important; padding-right: 32px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body className="email-page" style={pageStyle}>
        <Section className="email-page-content" style={{ padding: '32px 12px' }}>
        <Container style={containerStyle}>

          <Section style={cardStyle}>
            {/* Brand header — table layout, no flex (Outlook) */}
            <Section className="email-header" style={headerStyle}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Img src={URLS.logo} width="32" height="32" alt="FreeTradeJournal" style={logoStyle} />
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
        </Section>
      </Body>
    </Html>
  )
}

const pageStyle: React.CSSProperties = {
  backgroundColor: tone.page,
  fontFamily: fontStack,
  margin: 0,
  padding: 0,
}
const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
}
const cardStyle: React.CSSProperties = {
  backgroundColor: tone.card,
  border: 'none',
  borderRadius: 0,
}
const headerStyle: React.CSSProperties = {
  padding: '24px',
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
  textAlign: 'left' as const,
  borderTop: `1px solid ${tone.divider}`,
  marginTop: '28px',
}
const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: tone.muted,
  lineHeight: '1.6',
  margin: '0 0 8px',
}
const footerLinksStyle: React.CSSProperties = {
  fontSize: '14px',
  color: tone.muted,
  margin: 0,
}
const footerLinkStyle: React.CSSProperties = {
  color: tone.muted,
  textDecoration: 'underline',
  display: 'inline-block',
  padding: '8px 4px',
}

// ─── Eyebrow badge ──────────────────────────────────────────

export function Eyebrow({ children, quiet }: { children: React.ReactNode; quiet?: boolean }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: '16px' }}>
      <tbody>
        <tr>
          <td style={{
            backgroundColor: quiet ? tone.inset : '#f7e3ad',
            borderRadius: '999px',
            padding: '4px 12px',
          }}>
            <Text style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: quiet ? tone.muted : '#77510a',
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
                backgroundColor: primary ? tone.amber : 'transparent',
              borderRadius: '8px',
                border: primary ? `1px solid ${tone.amber}` : 'none',
            }}
          >
            <a
              href={href}
              target="_blank"
              style={{
                display: 'inline-block',
                padding: primary ? '14px 24px' : '14px 0',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: fontStack,
                color: primary ? tone.amberInk : tone.body,
                textDecoration: primary ? 'none' : 'underline',
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
      fontSize: '12px',
      fontWeight: 700,
      color: tone.heading,
      letterSpacing: '0.12em',
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

export function ProductPreview({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <Section className="email-content" style={{ ...styles.content, paddingTop: 0 }}>
      <Img src={src} alt={alt} width="536" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
      <Text style={{ ...styles.fine, fontSize: '12px', margin: '12px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{caption}</Text>
    </Section>
  )
}

export function FeatureList({ heading, items }: { heading: string; items: Feature[] }) {
  return (
    <Section className="email-content" style={styles.content}>
      <SectionLabel>{heading}</SectionLabel>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ tableLayout: 'fixed' }}>
        <tbody>
          {Array.from({ length: Math.ceil(items.length / 2) }, (_, row) => (
            <tr key={row}>
              {items.slice(row * 2, row * 2 + 2).map((feature, col) => (
                <td className="email-feature-cell" key={feature.label} width="50%" style={{ verticalAlign: 'top', padding: col === 0 ? '20px 20px 20px 0' : '20px 0 20px 20px', borderTop: `1px solid ${tone.divider}` }}>
                  <Text style={{ ...styles.fine, margin: '0 0 10px', fontFamily: 'monospace', color: '#77510a' }}>{String(row * 2 + col + 1).padStart(2, '0')}</Text>
                  <Text style={featureTitleStyle}>{feature.label}</Text>
                  <Text style={featureDescStyle}>{feature.desc}</Text>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

const featureTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: tone.heading,
  margin: '0 0 4px',
}
const featureDescStyle: React.CSSProperties = {
  fontSize: '14px',
  color: tone.muted,
  lineHeight: '1.6',
  margin: 0,
}
// ─── Numbered steps ─────────────────────────────────────────

export function NumberedSteps({ heading, steps }: { heading: string; steps: string[] }) {
  return (
    <Section className="email-content" style={{ ...styles.content, backgroundColor: tone.inset }}>
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
  color: '#77510a',
  margin: 0,
  lineHeight: '21px',
}
const stepTextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: tone.body,
  lineHeight: '1.5',
  margin: 0,
}

// ─── Receipt block (payment confirmation) ───────────────────

export interface ReceiptRow {
  label: string
  value: string
}

export function ReceiptBlock({ heading, rows, receiptUrl }: {
  heading: string
  rows: ReceiptRow[]
  /** Stripe hosted receipt — the compliance-grade copy. */
  receiptUrl?: string
}) {
  return (
    <Section className="email-content" style={styles.content}>
      <SectionLabel>{heading}</SectionLabel>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={receiptBoxStyle}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label}>
              <td style={{ ...receiptCellStyle, borderTop: i === 0 ? 'none' : `1px solid ${tone.insetBorder}` }}>
                <Text style={receiptLabelStyle}>{row.label}</Text>
              </td>
              <td style={{ ...receiptCellStyle, textAlign: 'right' as const, borderTop: i === 0 ? 'none' : `1px solid ${tone.insetBorder}` }}>
                <Text style={receiptValueStyle}>{row.value}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {receiptUrl && (
        <Text style={{ ...styles.fine, margin: '12px 0 0' }}>
          <Link href={receiptUrl} style={{ color: tone.muted, textDecoration: 'underline' }}>
            View or download your receipt
          </Link>
        </Text>
      )}
    </Section>
  )
}

const receiptBoxStyle: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '10px',
  borderCollapse: 'separate' as const,
}
const receiptCellStyle: React.CSSProperties = {
  padding: '12px 16px',
}
const receiptLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: tone.muted,
  margin: 0,
  lineHeight: '1.5',
}
const receiptValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: tone.heading,
  margin: 0,
  lineHeight: '1.5',
}

// ─── Stat grid (weekly digest) ──────────────────────────────

export interface Stat {
  value: string
  label: string
  /** 'up' renders green, 'down' renders red, default is heading color */
  toneHint?: 'up' | 'down'
}

// Long values (six-figure P&L, multi-currency weeks) step down in size so the
// tile never overflows — email clients have no CSS auto-fit to lean on.
function statValueFontSize(value: string): string {
  if (value.length > 16) return '15px'
  if (value.length > 12) return '18px'
  if (value.length > 9) return '21px'
  return '26px'
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  const rows: Stat[][] = []
  for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2))
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ tableLayout: 'fixed', borderCollapse: 'separate' as const, borderSpacing: '8px' }}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((s) => (
              <td key={s.label} width="50%" style={statCellStyle}>
                <Text style={{
                  ...statValueStyle,
                  fontSize: statValueFontSize(s.value),
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
  fontWeight: 700,
  margin: '0 0 2px',
  lineHeight: '1.2',
  overflowWrap: 'anywhere',
}
const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: tone.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: 0,
}
