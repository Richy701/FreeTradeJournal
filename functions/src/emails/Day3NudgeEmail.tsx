import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Row, Column, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface Day3NudgeEmailProps {
  firstName: string
}

const steps = [
  { num: '01', text: 'Go to Trade Log and click "Add Trade"' },
  { num: '02', text: 'Or hit "Import CSV" and drop in your broker export' },
  { num: '03', text: 'Your dashboard, P&L curve, and win rate update instantly' },
]

export function Day3NudgeEmail({ firstName }: Day3NudgeEmailProps) {
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
      </Head>
      <Preview>Your journal is set up — log your first trade in 60 seconds</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={accentBar} />

          {/* Header */}
          <Section style={header}>
            <Row>
              <Column style={{ width: '40px' }}>
                <Img
                  src="https://www.freetradejournal.com/favicon-64x64.png"
                  width="32"
                  height="32"
                  alt="FTJ"
                  style={logo}
                />
              </Column>
              <Column>
                <Text style={brandName}>FreeTradeJournal</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Heading style={h1}>Hey {firstName}, your journal is waiting</Heading>
            <Text style={subtext}>
              You signed up a few days ago but haven't logged a trade yet. It takes about{' '}
              <strong style={{ color: '#f5f5f5' }}>60 seconds</strong> — here's how:
            </Text>
          </Section>

          {/* Steps */}
          <Section style={card}>
            <Text style={cardLabel}>LOG YOUR FIRST TRADE</Text>
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <Row style={stepRow}>
                  <Column style={stepNumCol}><Text style={stepNumber}>{step.num}</Text></Column>
                  <Column><Text style={stepText}>{step.text}</Text></Column>
                </Row>
                {i < steps.length - 1 && <Hr style={stepDivider} />}
              </React.Fragment>
            ))}
          </Section>

          {/* Social proof */}
          <Section style={proofSection}>
            <Text style={proofText}>
              Over <strong style={{ color: '#f5f5f5' }}>3,000 traders</strong> are already tracking their edge on FreeTradeJournal — completely free.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href="https://www.freetradejournal.com/trades" style={button}>
              Log my first trade →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              If you have questions just reply to this email.
              <br />— Richy, FreeTradeJournal
            </Text>
            <Hr style={footerDivider} />
            <Text style={footerLinks}>
              <Link href="https://www.freetradejournal.com/privacy" style={footerLink}>Privacy</Link>
              {' · '}
              <Link href="https://www.freetradejournal.com/terms" style={footerLink}>Terms</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: 0,
  padding: '40px 0',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#161616',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #252525',
}
const accentBar: React.CSSProperties = {
  backgroundColor: '#f59e0b',
  height: '4px',
  lineHeight: '4px',
  fontSize: '1px',
}
const header: React.CSSProperties = {
  padding: '20px 28px',
  borderBottom: '1px solid #252525',
}
const logo: React.CSSProperties = { borderRadius: '7px', display: 'block' }
const brandName: React.CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#e5e5e5',
  lineHeight: '32px',
  paddingLeft: '10px',
}
const hero: React.CSSProperties = { padding: '36px 28px 28px' }
const h1: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#f5f5f5',
  margin: '0 0 14px',
  lineHeight: '1.3',
}
const subtext: React.CSSProperties = {
  fontSize: '15px',
  color: '#888',
  lineHeight: '1.7',
  margin: 0,
}
const card: React.CSSProperties = {
  margin: '0 28px 28px',
  backgroundColor: '#0f0f0f',
  borderRadius: '10px',
  border: '1px solid #252525',
  padding: '20px 22px',
}
const cardLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: '0.1em',
  margin: '0 0 18px',
}
const stepRow: React.CSSProperties = { marginBottom: 0 }
const stepNumCol: React.CSSProperties = { width: '32px', verticalAlign: 'top' }
const stepNumber: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#f59e0b',
  margin: '2px 0 0',
  lineHeight: '1.5',
}
const stepText: React.CSSProperties = {
  fontSize: '14px',
  color: '#bbb',
  lineHeight: '1.6',
  margin: 0,
}
const stepDivider: React.CSSProperties = { borderColor: '#252525', margin: '12px 0' }
const proofSection: React.CSSProperties = { padding: '0 28px 24px' }
const proofText: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  lineHeight: '1.6',
  margin: 0,
  borderLeft: '3px solid #f59e0b',
  paddingLeft: '12px',
}
const ctaSection: React.CSSProperties = {
  padding: '4px 28px 36px',
  textAlign: 'left',
}
const button: React.CSSProperties = {
  backgroundColor: '#f59e0b',
  color: '#000',
  fontWeight: 700,
  fontSize: '14px',
  padding: '13px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer: React.CSSProperties = { padding: '0 28px 28px' }
const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  lineHeight: '1.7',
  margin: '0 0 16px',
}
const footerDivider: React.CSSProperties = { borderColor: '#252525', margin: '0 0 14px' }
const footerLinks: React.CSSProperties = { fontSize: '12px', color: '#444', margin: 0 }
const footerLink: React.CSSProperties = { color: '#555', textDecoration: 'underline' }
