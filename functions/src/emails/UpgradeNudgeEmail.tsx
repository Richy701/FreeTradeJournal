import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface UpgradeNudgeEmailProps {
  firstName: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'A personalised breakdown of each trade. What you did right, what cost you money, and what to do next time.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on your prop firms. Which are profitable, which are draining you, and what to do about it.' },
  { label: 'AI Goal Coach', desc: 'Reads your actual trading data and tells you exactly where you\'re falling short of your goals.' },
  { label: 'Cloud Sync', desc: 'Your trades, journal, and settings backed up across every device. Never lose your data.' },
]

export function UpgradeNudgeEmail({ firstName }: UpgradeNudgeEmailProps) {
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
      <Preview>Most traders never log a single trade. You've done the hard part.</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src="https://www.freetradejournal.com/favicon-64x64.png"
              width="28"
              height="28"
              alt="FTJ"
              style={logo}
            />
            <Text style={brandName}>FreeTradeJournal</Text>
          </Section>

          <Hr style={topDivider} />

          {/* Banner */}
          <Section style={{ padding: 0 }}>
            <Img
              src="https://www.freetradejournal.com/images/email-banner.png"
              width="600"
              height="220"
              alt="Portfolio performance chart"
              style={{ display: 'block', width: '100%' }}
            />
          </Section>

          {/* Hero */}
          <Section style={content}>
            <Heading style={h1}>
              {firstName ? `${firstName}, you're` : "You're"} building real trading data
            </Heading>
            <Text style={body1}>
              You've been logging trades and building a record of your performance.
              That's the hard part — most traders never do it.
            </Text>
            <Text style={body1}>
              Pro takes what you've already built and turns it into actual coaching.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Features */}
          <Section style={content}>
            <Text style={label}>WHAT YOU UNLOCK WITH PRO</Text>

            {proFeatures.map((f, i) => (
              <React.Fragment key={f.label}>
                <Text style={featureTitle}>{f.label}</Text>
                <Text style={featureDesc}>{f.desc}</Text>
                {i < proFeatures.length - 1 && <Hr style={featureDivider} />}
              </React.Fragment>
            ))}
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={content}>
            <Text style={body1}>
              Pro is <strong>$5.99/month</strong>. Cancel anytime. Your free data stays exactly as it is.
            </Text>
            <Link href="https://www.freetradejournal.com/pricing" style={button}>
              See Pro features
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Richy from FreeTradeJournal. Reply if you have questions — I read every one.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://www.freetradejournal.com/privacy" style={footerLink}>Privacy Policy</Link>
              {' · '}
              <Link href="https://www.freetradejournal.com/terms" style={footerLink}>Terms</Link>
              {' · '}
              <Link href="mailto:richy@freetradejournal.com?subject=Unsubscribe" style={footerLink}>Unsubscribe</Link>
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
  maxWidth: '600px',
  margin: '0 auto',
}
const header: React.CSSProperties = {
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
}
const logo: React.CSSProperties = {
  borderRadius: '6px',
  display: 'inline-block',
  verticalAlign: 'middle',
}
const brandName: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  margin: '0 0 0 10px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#ededed',
  lineHeight: '28px',
}
const topDivider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: 0,
}
const divider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: 0,
}
const featureDivider: React.CSSProperties = {
  borderColor: '#1a1a1a',
  margin: '16px 0',
}
const content: React.CSSProperties = {
  padding: '32px 32px',
}
const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: '#ededed',
  margin: '0 0 16px',
  lineHeight: '1.4',
}
const body1: React.CSSProperties = {
  fontSize: '15px',
  color: '#888',
  lineHeight: '1.5',
  margin: '0 0 12px',
}
const label: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#f59e0b',
  letterSpacing: '0.08em',
  margin: '0 0 20px',
  textTransform: 'uppercase' as const,
}
const featureTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#ededed',
  margin: '0 0 6px',
}
const featureDesc: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  lineHeight: '1.65',
  margin: 0,
}
const button: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '8px',
  backgroundColor: '#f59e0b',
  color: '#000000',
  fontWeight: 600,
  fontSize: '15px',
  padding: '13px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  lineHeight: '1.5',
}
const footer: React.CSSProperties = {
  padding: '24px 32px',
}
const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#444',
  lineHeight: '1.6',
  margin: '0 0 4px',
}
const footerLinks: React.CSSProperties = {
  fontSize: '12px',
  color: '#333',
  margin: '12px 0 0',
}
const footerLink: React.CSSProperties = {
  color: '#555',
  textDecoration: 'underline',
}
