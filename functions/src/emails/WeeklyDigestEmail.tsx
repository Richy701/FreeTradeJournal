import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, StatGrid, styles } from './components'
import type { Stat } from './components'
import { URLS } from './facts'

interface WeeklyDigestEmailProps {
  firstName: string
  tradeCount: number
  winRate: number
  pnl: string
  bestTrade: string
  weekLabel: string
  unsubscribeUrl?: string
}

function pnlTone(value: string): Stat['toneHint'] {
  if (value.startsWith('+')) return 'up'
  if (value.startsWith('-')) return 'down'
  return undefined
}

export function WeeklyDigestEmail({ firstName, tradeCount, winRate, pnl, bestTrade, weekLabel, unsubscribeUrl }: WeeklyDigestEmailProps) {
  const hasActivity = tradeCount > 0

  const stats: Stat[] = [
    { value: String(tradeCount), label: 'Trades' },
    { value: `${winRate}%`, label: 'Win rate' },
    { value: pnl, label: 'P&L', toneHint: pnlTone(pnl) },
    { value: bestTrade, label: 'Best trade', toneHint: pnlTone(bestTrade) },
  ]

  return (
    <EmailShell
      preview={hasActivity
        ? `${weekLabel}: ${tradeCount} trades, ${winRate}% win rate, ${pnl} P&L`
        : `${weekLabel}: No trades logged — your journal is waiting.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="Sent every Monday. Reply if you have feedback — I read every one."
    >
      <Section className="email-content" style={{ ...styles.content, paddingBottom: hasActivity ? '24px' : 0 }}>
        <Eyebrow>{weekLabel}</Eyebrow>
        <Heading style={{ ...styles.h1, marginBottom: 0 }}>
          {hasActivity
            ? `${firstName ? firstName + ', here' : 'Here'}'s your week.`
            : `${firstName ? firstName + ', your' : 'Your'} journal was quiet this week.`
          }
        </Heading>
      </Section>

      {hasActivity ? (
        <>
          <Section className="email-content" style={{ ...styles.content, paddingTop: 0, paddingBottom: '24px' }}>
            <StatGrid stats={stats} />
          </Section>

          <Hr style={styles.divider} />

          <Section className="email-content" style={styles.content}>
            <Text style={styles.paragraph}>
              Review your equity curve, calendar and trade breakdowns.
            </Text>
            <EmailButton href={URLS.dashboard}>View full dashboard</EmailButton>
          </Section>
        </>
      ) : (
        <Section className="email-content" style={{ ...styles.content, paddingTop: '16px' }}>
          <Text style={styles.paragraph}>
            If you traded this week, add the trades you want to review. Taking a week off is fine too.
          </Text>
          <EmailButton href={URLS.trades}>Log a trade</EmailButton>
        </Section>
      )}

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={{ ...styles.fine, margin: 0 }}>
          Something would make this recap more useful?
        </Text>
        <EmailButton href={URLS.feedbackFromDigest} variant="secondary">Share feedback</EmailButton>
      </Section>
    </EmailShell>
  )
}
