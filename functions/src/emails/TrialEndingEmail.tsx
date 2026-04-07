import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface TrialEndingEmailProps {
  firstName: string
  trialEndDate: string
}

export function TrialEndingEmail({ firstName, trialEndDate }: TrialEndingEmailProps) {
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
      <Preview>Your Pro trial ends on {trialEndDate}. Cancel before then and you will not be charged.</Preview>
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

          {/* Hero */}
          <Section style={content}>
            <Text style={eyebrow}>YOUR TRIAL IS ENDING</Text>
            <Heading style={h1}>
              {firstName ? `${firstName}, your Pro trial ends in 2 days.` : 'Your Pro trial ends in 2 days.'}
            </Heading>
            <Text style={body1}>
              Your trial runs until <strong style={{ color: '#ededed' }}>{trialEndDate}</strong>. After that, your subscription will renew automatically.
            </Text>
            <Text style={body1}>
              If you want to cancel, go to <strong style={{ color: '#ededed' }}>Settings → Subscription</strong> before then — no charge if you cancel in time.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* CTAs */}
          <Section style={content}>
            <Text style={body1}>Ready to keep your edge?</Text>
            <Link href="https://www.freetradejournal.com/dashboard" style={primaryButton}>
              Continue with Pro
            </Link>
            <Text style={orText}>or</Text>
            <Link href="https://www.freetradejournal.com/settings" style={secondaryButton}>
              Manage subscription
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
  margin: '0 0 16px',
}
const primaryButton: React.CSSProperties = {
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
const orText: React.CSSProperties = {
  fontSize: '13px',
  color: '#444',
  margin: '12px 0',
}
const secondaryButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1f1f1f',
  color: '#ededed',
  fontWeight: 600,
  fontSize: '15px',
  padding: '13px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  lineHeight: '1.5',
  border: '1px solid #2a2a2a',
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
