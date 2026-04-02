import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Row, Column, Img, Text, Heading,
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
      <Preview>Your Pro subscription has been cancelled — your data is safe</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Grey top accent for cancellation */}
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
            <Heading style={h1}>Subscription cancelled</Heading>
            <Text style={subtext}>
              Hey {firstName}, your Pro subscription has been cancelled. You'll keep full Pro access until{' '}
              <strong style={{ color: '#f5f5f5' }}>{endDate}</strong>, then your account reverts to the free plan.
            </Text>
          </Section>

          {/* Reassurance */}
          <Section style={card}>
            <Row>
              <Column style={iconCol}><Text style={icon}>🔒</Text></Column>
              <Column>
                <Text style={cardTitle}>Your data is safe</Text>
                <Text style={cardText}>
                  All your trades, journal entries, and goals are intact — nothing is deleted when you downgrade.
                </Text>
              </Column>
            </Row>
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
            <Text style={footerText}>
              If you cancelled by mistake or have questions, just reply to this email.
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
  backgroundColor: '#333',
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
  padding: '36px 28px 28px',
}

const h1: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#f5f5f5',
  margin: '0 0 14px',
  lineHeight: '1.25',
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
  padding: '18px 22px',
}

const iconCol: React.CSSProperties = {
  width: '36px',
  verticalAlign: 'top',
}

const icon: React.CSSProperties = {
  fontSize: '18px',
  margin: '2px 0 0',
  lineHeight: '1',
}

const cardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#e5e5e5',
  margin: '0 0 4px',
}

const cardText: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  lineHeight: '1.6',
  margin: 0,
}

const ctaSection: React.CSSProperties = {
  padding: '4px 28px 36px',
  textAlign: 'left',
}

const ctaLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#555',
  margin: '0 0 12px',
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
