import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Row, Column, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface ProUpgradeEmailProps {
  firstName: string
  planLabel: string
}

const features = [
  { icon: '◆', label: 'AI Trading Coach' },
  { icon: '▲', label: 'AI Trade Analysis' },
  { icon: '◎', label: 'AI Risk Alerts' },
  { icon: '↑', label: 'Cloud Sync' },
  { icon: '✦', label: 'PropTracker' },
]

export function ProUpgradeEmail({ firstName, planLabel }: ProUpgradeEmailProps) {
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
      <Preview>You're Pro. Everything is unlocked.</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Amber hero header */}
          <Section style={amberHeader}>
            <Img
              src="https://www.freetradejournal.com/favicon-64x64.png"
              width="32"
              height="32"
              alt="FTJ"
              style={logo}
            />
            <Text style={proLabel}>PRO</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Text style={eyebrow}>{planLabel.toUpperCase()}</Text>
            <Heading style={h1}>You're Pro now,{'\n'}{firstName}.</Heading>
            <Text style={subtext}>
              Every feature is unlocked. Your edge just got sharper.
            </Text>
            <Link href="https://www.freetradejournal.com/dashboard" style={button}>
              Go to your dashboard →
            </Link>
          </Section>

          {/* Features */}
          <Section style={featuresSection}>
            <Text style={featuresLabel}>WHAT'S NOW UNLOCKED</Text>
            <Row style={featuresGrid}>
              {features.map((f, i) => (
                <Column key={i} style={featureItem}>
                  <Text style={featureIcon}>{f.icon}</Text>
                  <Text style={featureName}>{f.label}</Text>
                </Column>
              ))}
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

const amberHeader: React.CSSProperties = {
  backgroundColor: '#f59e0b',
  padding: '20px 32px',
  textAlign: 'left',
}

const logo: React.CSSProperties = {
  borderRadius: '8px',
  display: 'inline-block',
  verticalAlign: 'middle',
  filter: 'brightness(0)',
}

const proLabel: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  margin: '0 0 0 10px',
  fontSize: '11px',
  fontWeight: 800,
  color: '#000',
  letterSpacing: '0.15em',
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
  whiteSpace: 'pre-line',
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

const featuresSection: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  borderTop: '1px solid #1f1f1f',
  borderBottom: '1px solid #1f1f1f',
  padding: '28px 32px',
}

const featuresLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: '#444',
  letterSpacing: '0.15em',
  margin: '0 0 20px',
}

const featuresGrid: React.CSSProperties = {
  width: '100%',
}

const featureItem: React.CSSProperties = {
  textAlign: 'center',
  padding: '0 4px',
  width: '20%',
}

const featureIcon: React.CSSProperties = {
  fontSize: '14px',
  color: '#f59e0b',
  margin: '0 0 6px',
  lineHeight: '1',
  fontWeight: 700,
}

const featureName: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#888',
  margin: 0,
  lineHeight: '1.3',
  letterSpacing: '0.01em',
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
