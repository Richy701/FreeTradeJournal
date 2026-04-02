import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface CancellationEmailProps {
  firstName: string
  endDate: string
}

export function CancellationEmail({ firstName, endDate }: CancellationEmailProps) {
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
      <Preview>Your Pro subscription has been cancelled — your data stays safe.</Preview>
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
            <Text style={eyebrow}>SUBSCRIPTION CANCELLED</Text>
            <Heading style={h1}>
              Sorry to see you go, {firstName}.
            </Heading>
            <Text style={subtext}>
              Your Pro access runs until <strong style={{ color: '#e5e5e5' }}>{endDate}</strong>. After that, your account moves to the free plan — but your trades, journal, and goals are all still there.
            </Text>
          </Section>

          {/* Reassurance strip */}
          <Section style={strip}>
            <Text style={stripText}>✉ Your data is safe and nothing is deleted.</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaLabel}>Changed your mind?</Text>
            <Link href="https://www.freetradejournal.com/pricing" style={button}>
              Resubscribe →
            </Link>
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
  color: '#555',
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
  margin: 0,
}

const strip: React.CSSProperties = {
  backgroundColor: '#0d0d0d',
  borderTop: '1px solid #1f1f1f',
  borderBottom: '1px solid #1f1f1f',
  padding: '16px 32px',
  textAlign: 'center',
}

const stripText: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: 0,
}

const ctaSection: React.CSSProperties = {
  padding: '32px 32px',
}

const ctaLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  margin: '0 0 14px',
}

const button: React.CSSProperties = {
  backgroundColor: '#1f1f1f',
  color: '#e5e5e5',
  fontWeight: 600,
  fontSize: '14px',
  padding: '13px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  border: '1px solid #2a2a2a',
  letterSpacing: '0.01em',
}

const footer: React.CSSProperties = {
  padding: '0 32px 24px',
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
