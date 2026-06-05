import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface Day21BackupEmailProps {
  firstName: string
}

export function Day21BackupEmail({ firstName }: Day21BackupEmailProps) {
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
      <Preview>Your trades are only saved in your browser. Here's how to protect them.</Preview>
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
            <Heading style={h1}>
              {firstName ? `${firstName}, your data isn't backed up.` : 'Your data isn\'t backed up.'}
            </Heading>
            <Text style={body1}>
              You have been journaling for three weeks now — and your trades are only saved in your browser's local storage.
            </Text>
            <Text style={body1}>
              That means <strong style={{ color: '#ededed' }}>clearing your browser data, using a different device, or even a browser update</strong> could wipe everything.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Two options */}
          <Section style={content}>
            <Text style={label}>TWO WAYS TO PROTECT YOUR DATA</Text>

            <Text style={optionNum}>01</Text>
            <Text style={optionText}>
              <strong style={{ color: '#ededed' }}>Export a backup now</strong> — Go to Settings &gt; Data Management &gt; Export Backup. Save the file somewhere safe.
            </Text>
            <Hr style={stepDivider} />
            <Text style={optionNum}>02</Text>
            <Text style={optionText}>
              <strong style={{ color: '#ededed' }}>Enable cloud sync with Pro</strong> — Your trades sync automatically across all your devices. Never worry about losing data again.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={content}>
            <Text style={body1}>
              Cloud sync is included in all Pro plans, starting at $5.99/mo with a <strong style={{ color: '#ededed' }}>14-day free trial</strong>.
            </Text>
            <Link href="https://www.freetradejournal.com/settings" style={buttonOutline}>
              Export a backup
            </Link>
            <Text style={{ textAlign: 'center' as const, margin: '12px 0' }}>
              <span style={{ color: '#666', fontSize: '13px' }}>or</span>
            </Text>
            <Link href="https://www.freetradejournal.com/pricing" style={button}>
              Enable cloud sync
            </Link>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Richy from FreeTradeJournal. Reply if you have questions.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://www.freetradejournal.com/privacy" style={footerLink}>Privacy Policy</Link>
              {' · '}
              <Link href="https://www.freetradejournal.com/terms" style={footerLink}>Terms</Link>
              {' · '}
              <Link href="mailto:hello@freetradejournal.com?subject=Unsubscribe" style={footerLink}>Unsubscribe</Link>
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
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto' }
const header: React.CSSProperties = { padding: '24px 32px', display: 'flex', alignItems: 'center' }
const logo: React.CSSProperties = { borderRadius: '6px', display: 'inline-block', verticalAlign: 'middle' }
const brandName: React.CSSProperties = { display: 'inline-block', verticalAlign: 'middle', margin: '0 0 0 10px', fontSize: '14px', fontWeight: 600, color: '#ededed', lineHeight: '28px' }
const topDivider: React.CSSProperties = { borderColor: '#1f1f1f', margin: 0 }
const divider: React.CSSProperties = { borderColor: '#1f1f1f', margin: 0 }
const stepDivider: React.CSSProperties = { borderColor: '#1a1a1a', margin: '12px 0' }
const content: React.CSSProperties = { padding: '32px 32px' }
const h1: React.CSSProperties = { color: '#ededed', fontSize: '22px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 16px 0' }
const body1: React.CSSProperties = { color: '#999', fontSize: '15px', lineHeight: 1.6, margin: '0 0 12px 0' }
const label: React.CSSProperties = { color: '#f59e0b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 20px 0' }
const optionNum: React.CSSProperties = { color: '#f59e0b', fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0' }
const optionText: React.CSSProperties = { color: '#999', fontSize: '14px', lineHeight: 1.6, margin: '0 0 4px 0' }
const button: React.CSSProperties = {
  display: 'block', textAlign: 'center' as const, backgroundColor: '#f59e0b', color: '#000', fontSize: '14px',
  fontWeight: 700, padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', margin: '0 auto', width: '220px',
}
const buttonOutline: React.CSSProperties = {
  display: 'block', textAlign: 'center' as const, backgroundColor: 'transparent', color: '#ededed', fontSize: '14px',
  fontWeight: 600, padding: '11px 24px', borderRadius: '8px', textDecoration: 'none', margin: '0 auto', width: '220px',
  border: '1px solid #333',
}
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { color: '#666', fontSize: '12px', lineHeight: 1.5, margin: '0 0 8px 0' }
const footerLinks: React.CSSProperties = { margin: 0, fontSize: '11px' }
const footerLink: React.CSSProperties = { color: '#555', textDecoration: 'underline' }
