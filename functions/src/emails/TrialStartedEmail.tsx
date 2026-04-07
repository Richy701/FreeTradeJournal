import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface TrialStartedEmailProps {
  firstName: string
  trialEndDate: string
}

const features = [
  { label: 'AI Trade Review', desc: 'A breakdown of each trade — what worked, what cost you, what to fix.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on each prop firm and whether it is worth your time.' },
  { label: 'AI Goal Coach', desc: 'Reads your data and tells you exactly where you are falling short.' },
  { label: 'Cloud Sync', desc: 'Your trades and journal backed up across every device.' },
]

export function TrialStartedEmail({ firstName, trialEndDate }: TrialStartedEmailProps) {
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
      <Preview>Your 14-day Pro trial has started. Every feature is unlocked — here is what to try first.</Preview>
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
              src="https://www.freetradejournal.com/images/email-banner-pro.png"
              width="600"
              height="200"
              alt="Pro trial started"
              style={{ display: 'block', width: '100%' }}
            />
          </Section>

          {/* Hero */}
          <Section style={content}>
            <Text style={eyebrow}>14-DAY FREE TRIAL</Text>
            <Heading style={h1}>
              {firstName ? `Your trial has started, ${firstName}.` : 'Your trial has started.'}
            </Heading>
            <Text style={body1}>
              Every Pro feature is unlocked until <strong style={{ color: '#ededed' }}>{trialEndDate}</strong>. No charge until then — and you can cancel anytime from Settings.
            </Text>
            <Link href="https://www.freetradejournal.com/dashboard" style={button}>
              Go to your dashboard
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Features */}
          <Section style={content}>
            <Text style={label}>WHAT IS NOW UNLOCKED</Text>
            {features.map((f, i) => (
              <React.Fragment key={f.label}>
                <Text style={featureTitle}>{f.label}</Text>
                <Text style={featureDesc}>{f.desc}</Text>
                {i < features.length - 1 && <Hr style={featureDivider} />}
              </React.Fragment>
            ))}
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
const eyebrow: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: '0.1em',
  margin: '0 0 12px',
}
const h1: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#ededed',
  margin: '0 0 16px',
  lineHeight: '1.3',
  letterSpacing: '-0.01em',
}
const body1: React.CSSProperties = {
  fontSize: '15px',
  color: '#888',
  lineHeight: '1.5',
  margin: '0 0 24px',
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
  lineHeight: '1.5',
  margin: 0,
}
const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#f59e0b',
  color: '#000000',
  fontWeight: 700,
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
  lineHeight: '1.5',
  margin: '0 0 12px',
}
const footerLinks: React.CSSProperties = {
  fontSize: '12px',
  color: '#333',
  margin: 0,
}
const footerLink: React.CSSProperties = {
  color: '#555',
  textDecoration: 'underline',
}
