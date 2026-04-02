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
  { title: 'AI Trading Coach', desc: 'Personalised coaching based on your real trade history' },
  { title: 'AI Trade Analysis', desc: 'Pattern detection across your last 30 days' },
  { title: 'AI Risk Alerts', desc: 'Get warned before revenge trading costs you' },
  { title: 'Cloud Sync', desc: 'Your journal is safe and synced across all devices' },
  { title: 'PropTracker Unlimited', desc: 'Unlimited prop firm accounts, charts, and AI analysis' },
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
      <Preview>You're now Pro — everything is unlocked</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Amber top accent */}
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
            <Text style={proBadge}>PRO</Text>
            <Heading style={h1}>You're Pro now, {firstName} ⚡</Heading>
            <Text style={planPill}>{planLabel}</Text>
            <Text style={subtext}>Everything is unlocked. Here's what you can use right now:</Text>
          </Section>

          {/* Features */}
          <Section style={card}>
            <Text style={cardLabel}>WHAT'S UNLOCKED</Text>
            {features.map((f, i) => (
              <React.Fragment key={i}>
                <Row style={featureRow}>
                  <Column style={iconCol}><Text style={icon}>⚡</Text></Column>
                  <Column>
                    <Text style={featureTitle}>{f.title}</Text>
                    <Text style={featureDesc}>{f.desc}</Text>
                  </Column>
                </Row>
                {i < features.length - 1 && <Hr style={featureDivider} />}
              </React.Fragment>
            ))}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href="https://www.freetradejournal.com/dashboard" style={button}>
              Go to your dashboard →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Manage your subscription anytime in Settings → Subscription.
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

const logo: React.CSSProperties = {
  borderRadius: '7px',
  display: 'block',
}

const brandName: React.CSSProperties = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: '#e5e5e5',
  lineHeight: '32px',
  paddingLeft: '10px',
}

const hero: React.CSSProperties = {
  padding: '36px 28px 24px',
}

const proBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#f59e0b',
  color: '#000',
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  padding: '3px 10px',
  borderRadius: '99px',
  margin: '0 0 14px',
}

const h1: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#f5f5f5',
  margin: '0 0 12px',
  lineHeight: '1.25',
}

const planPill: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1f1f1f',
  color: '#888',
  fontSize: '12px',
  fontWeight: 500,
  padding: '4px 12px',
  borderRadius: '99px',
  border: '1px solid #2a2a2a',
  margin: '0 0 16px',
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

const featureRow: React.CSSProperties = {
  marginBottom: 0,
}

const iconCol: React.CSSProperties = {
  width: '28px',
  verticalAlign: 'top',
}

const icon: React.CSSProperties = {
  fontSize: '14px',
  margin: '2px 0 0',
  lineHeight: '1.4',
}

const featureTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#e5e5e5',
  margin: '0 0 2px',
  lineHeight: '1.4',
}

const featureDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: 0,
  lineHeight: '1.5',
}

const featureDivider: React.CSSProperties = {
  borderColor: '#252525',
  margin: '12px 0',
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

const footer: React.CSSProperties = {
  padding: '0 28px 28px',
}

const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const footerDivider: React.CSSProperties = {
  borderColor: '#252525',
  margin: '0 0 14px',
}

const footerLinks: React.CSSProperties = {
  fontSize: '12px',
  color: '#444',
  margin: 0,
}

const footerLink: React.CSSProperties = {
  color: '#555',
  textDecoration: 'underline',
}
