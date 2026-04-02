import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Row, Column, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
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
      <Preview>Your trading journal is ready. Let's build an edge.</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src="https://www.freetradejournal.com/favicon-64x64.png"
              width="36"
              height="36"
              alt="FTJ"
              style={logo}
            />
            <Text style={brandName}>FreeTradeJournal</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Text style={eyebrow}>ACCOUNT READY</Text>
            <Heading style={h1}>
              Welcome, {firstName}.
            </Heading>
            <Text style={subtext}>
              Your journal is set up and waiting. Track trades, spot patterns, and build the discipline to trade consistently.
            </Text>
            <Link href="https://www.freetradejournal.com/dashboard" style={button}>
              Open your journal →
            </Link>
          </Section>

          {/* Feature strip */}
          <Section style={featureStrip}>
            <Row>
              <Column style={featureCol}>
                <Text style={featureIcon}>▲</Text>
                <Text style={featureLabel}>Analytics</Text>
                <Text style={featureDesc}>P&L, win rate & equity curve</Text>
              </Column>
              <Column style={featureDividerCol}><Text style={featureDividerText}>|</Text></Column>
              <Column style={featureCol}>
                <Text style={featureIcon}>◎</Text>
                <Text style={featureLabel}>Goals</Text>
                <Text style={featureDesc}>Risk rules & accountability</Text>
              </Column>
              <Column style={featureDividerCol}><Text style={featureDividerText}>|</Text></Column>
              <Column style={featureCol}>
                <Text style={featureIcon}>↓</Text>
                <Text style={featureLabel}>Import</Text>
                <Text style={featureDesc}>CSV upload from any broker</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Richy<br />Founder, FreeTradeJournal</Text>
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
  maxWidth: '520px',
  margin: '0 auto',
  backgroundColor: '#111',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #1f1f1f',
}

const header: React.CSSProperties = {
  padding: '20px 32px',
  borderBottom: '1px solid #1f1f1f',
  textAlign: 'left',
}

const logo: React.CSSProperties = {
  borderRadius: '8px',
  display: 'inline-block',
  verticalAlign: 'middle',
}

const brandName: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  margin: '0 0 0 10px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#888',
  letterSpacing: '0.01em',
}

const hero: React.CSSProperties = {
  padding: '48px 32px 36px',
}

const eyebrow: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: '0.15em',
  margin: '0 0 16px',
}

const h1: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#f5f5f5',
  margin: '0 0 16px',
  lineHeight: '1.2',
  letterSpacing: '-0.02em',
}

const subtext: React.CSSProperties = {
  fontSize: '15px',
  color: '#777',
  lineHeight: '1.7',
  margin: '0 0 32px',
}

const button: React.CSSProperties = {
  backgroundColor: '#f59e0b',
  color: '#000',
  fontWeight: 700,
  fontSize: '14px',
  padding: '13px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.01em',
}

const featureStrip: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  borderTop: '1px solid #1f1f1f',
  borderBottom: '1px solid #1f1f1f',
  padding: '28px 24px',
  textAlign: 'center',
}

const featureCol: React.CSSProperties = {
  textAlign: 'center',
  padding: '0 12px',
}

const featureDividerCol: React.CSSProperties = {
  width: '1px',
  padding: 0,
}

const featureDividerText: React.CSSProperties = {
  color: '#222',
  fontSize: '20px',
  margin: 0,
  lineHeight: '1',
}

const featureIcon: React.CSSProperties = {
  fontSize: '16px',
  color: '#f59e0b',
  margin: '0 0 6px',
  lineHeight: '1',
  fontWeight: 700,
}

const featureLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#e5e5e5',
  margin: '0 0 4px',
  letterSpacing: '0.01em',
}

const featureDesc: React.CSSProperties = {
  fontSize: '11px',
  color: '#555',
  margin: 0,
  lineHeight: '1.4',
}

const footer: React.CSSProperties = {
  padding: '24px 32px',
}

const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#444',
  margin: '0 0 16px',
}

const footerDivider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: '0 0 14px',
}

const footerLinks: React.CSSProperties = {
  fontSize: '12px',
  color: '#333',
  margin: 0,
}

const footerLink: React.CSSProperties = {
  color: '#444',
  textDecoration: 'underline',
}
