import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Img, Text, Heading,
  Hr, Link, Preview, Font,
} from '@react-email/components'

interface WeeklyDigestEmailProps {
  firstName: string
  tradeCount: number
  winRate: number
  pnl: string
  bestTrade: string
  weekLabel: string
}

export function WeeklyDigestEmail({ firstName, tradeCount, winRate, pnl, bestTrade, weekLabel }: WeeklyDigestEmailProps) {
  const hasActivity = tradeCount > 0

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
      <Preview>{hasActivity ? `${weekLabel}: ${tradeCount} trades, ${winRate}% win rate, ${pnl} P&L` : `${weekLabel}: No trades logged — your journal is waiting.`}</Preview>
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
            <Text style={weekBadge}>{weekLabel}</Text>
            <Heading style={h1}>
              {hasActivity
                ? `${firstName ? firstName + ', here' : 'Here'}'s your week.`
                : `${firstName ? firstName + ', your' : 'Your'} journal was quiet this week.`
              }
            </Heading>
          </Section>

          {hasActivity ? (
            <>
              {/* Stats Grid */}
              <Section style={content}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' as const }}>
                  <tr>
                    <td style={statCell}>
                      <Text style={statValue}>{tradeCount}</Text>
                      <Text style={statLabel}>Trades</Text>
                    </td>
                    <td style={statCell}>
                      <Text style={statValue}>{winRate}%</Text>
                      <Text style={statLabel}>Win Rate</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={statCell}>
                      <Text style={statValue}>{pnl}</Text>
                      <Text style={statLabel}>P&L</Text>
                    </td>
                    <td style={statCell}>
                      <Text style={statValue}>{bestTrade}</Text>
                      <Text style={statLabel}>Best Trade</Text>
                    </td>
                  </tr>
                </table>
              </Section>

              <Hr style={divider} />

              <Section style={content}>
                <Text style={body1}>
                  Open your dashboard to see your full equity curve, calendar heatmap, and trade breakdown.
                </Text>
                <Link href="https://www.freetradejournal.com/dashboard" style={button}>
                  View full dashboard
                </Link>
              </Section>
            </>
          ) : (
            <>
              <Section style={content}>
                <Text style={body1}>
                  No trades logged this week. Even logging one trade keeps the habit alive and your data building.
                </Text>
                <Link href="https://www.freetradejournal.com/trades" style={button}>
                  Log a trade
                </Link>
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Sent every Monday. Reply if you have feedback — I read every one.
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
const content: React.CSSProperties = { padding: '24px 32px' }
const weekBadge: React.CSSProperties = { color: '#f59e0b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 8px 0', textTransform: 'uppercase' as const }
const h1: React.CSSProperties = { color: '#ededed', fontSize: '22px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 8px 0' }
const body1: React.CSSProperties = { color: '#999', fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px 0' }
const statCell: React.CSSProperties = { padding: '16px 12px', textAlign: 'center' as const, width: '50%', border: '1px solid #1a1a1a', borderRadius: '8px' }
const statValue: React.CSSProperties = { color: '#ededed', fontSize: '28px', fontWeight: 700, margin: '0 0 2px 0', lineHeight: 1.2 }
const statLabel: React.CSSProperties = { color: '#666', fontSize: '12px', fontWeight: 500, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const button: React.CSSProperties = {
  display: 'block', textAlign: 'center' as const, backgroundColor: '#f59e0b', color: '#000', fontSize: '14px',
  fontWeight: 700, padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', margin: '0 auto', width: '220px',
}
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { color: '#666', fontSize: '12px', lineHeight: 1.5, margin: '0 0 8px 0' }
const footerLinks: React.CSSProperties = { margin: 0, fontSize: '11px' }
const footerLink: React.CSSProperties = { color: '#555', textDecoration: 'underline' }
