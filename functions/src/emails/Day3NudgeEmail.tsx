import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
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
      <Preview>You signed up a few days ago. Logging your first trade takes 60 seconds.</Preview>
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
              src="https://www.freetradejournal.com/images/email-banner-day3.png"
              width="600"
              height="200"
              alt="Log your first trade"
              style={{ display: 'block', width: '100%' }}
            />
          </Section>

          {/* Hero */}
          <Section style={content}>
            <Heading style={h1}>
              {firstName ? `Hey ${firstName}, your journal is waiting.` : 'Your journal is waiting.'}
            </Heading>
            <Text style={body1}>
              You signed up a few days ago but have not logged a trade yet. It takes about <strong style={{ color: '#ededed' }}>60 seconds</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Steps */}
          <Section style={content}>
            <Text style={label}>HOW TO LOG YOUR FIRST TRADE</Text>
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <Text style={stepNumber}>{step.num}</Text>
                <Text style={stepText}>{step.text}</Text>
                {i < steps.length - 1 && <Hr style={stepDivider} />}
              </React.Fragment>
            ))}
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={content}>
            <Text style={body1}>
              Over <strong style={{ color: '#ededed' }}>3,000 traders</strong> are already tracking their edge on FreeTradeJournal — completely free.
            </Text>
            <Link href="https://www.freetradejournal.com/trades" style={button}>
              Log my first trade
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
const stepDivider: React.CSSProperties = {
  borderColor: '#1a1a1a',
  margin: '12px 0',
}
const content: React.CSSProperties = {
  padding: '32px 32px',
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
const stepNumber: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#f59e0b',
  margin: '0 0 4px',
  letterSpacing: '0.05em',
}
const stepText: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
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
