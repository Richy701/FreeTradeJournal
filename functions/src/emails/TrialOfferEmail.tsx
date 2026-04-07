import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface TrialOfferEmailProps {
  firstName: string
}

const features = [
  { label: 'AI Trade Review', desc: 'A breakdown of every trade: what worked, what cost you, what to fix.' },
  { label: 'AI Goal Coach', desc: 'Reads your data and tells you exactly where you are falling short.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on which prop firms are actually worth your money.' },
  { label: 'Cloud Sync', desc: 'Your journal backed up and available on every device.' },
]

export function TrialOfferEmail({ firstName }: TrialOfferEmailProps) {
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
      <Preview>14 days of Pro, free. No catch, no commitment.</Preview>
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
            <Text style={eyebrow}>FOR FREETRADEJOURNAL USERS</Text>
            <Heading style={h1}>
              {firstName ? `${firstName}, here's 14 days of Pro on us.` : "Here's 14 days of Pro on us."}
            </Heading>
            <Text style={body1}>
              We recently launched Pro trials and we wanted to make sure you had a chance to try it. Start a Pro subscription and get <strong style={{ color: '#ededed' }}>14 days completely free</strong>. No charge until the trial ends.
            </Text>
            <Text style={body1}>
              Cancel any time before then and you will not pay a thing.
            </Text>
            <Link href="https://www.freetradejournal.com/pricing" style={button}>
              Claim your free trial
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Features */}
          <Section style={content}>
            <Text style={label}>WHAT YOU GET WITH PRO</Text>
            {features.map((f, i) => (
              <React.Fragment key={f.label}>
                <Text style={featureTitle}>{f.label}</Text>
                <Text style={featureDesc}>{f.desc}</Text>
                {i < features.length - 1 && <Hr style={featureDivider} />}
              </React.Fragment>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Sign-off */}
          <Section style={content}>
            <Text style={body1}>
              If you have been journaling your trades you already have data worth analysing. The AI features will show you things you probably have not spotted yet.
            </Text>
            <Text style={signoff}>
              Richy, FreeTradeJournal
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You are receiving this because you have a FreeTradeJournal account. Reply if you have questions, I read every one.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://www.freetradejournal.com/privacy" style={footerLink}>Privacy Policy</Link>
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
  margin: '0 0 20px',
  lineHeight: '1.3',
  letterSpacing: '-0.01em',
}
const body1: React.CSSProperties = {
  fontSize: '15px',
  color: '#888',
  lineHeight: '1.6',
  margin: '0 0 16px',
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
  marginTop: '8px',
  backgroundColor: '#f59e0b',
  color: '#000000',
  fontWeight: 700,
  fontSize: '15px',
  padding: '13px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  lineHeight: '1.5',
}
const signoff: React.CSSProperties = {
  fontSize: '14px',
  color: '#555',
  margin: '4px 0 0',
  fontStyle: 'italic',
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
