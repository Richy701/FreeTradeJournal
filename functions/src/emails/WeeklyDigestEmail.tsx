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
      <Section style={styles.content}>
        <Eyebrow>{weekLabel}</Eyebrow>
        <Heading style={styles.h1}>
          {hasActivity
            ? `${firstName ? firstName + ', here' : 'Here'}'s your week.`
            : `${firstName ? firstName + ', your' : 'Your'} journal was quiet this week.`
          }
        </Heading>
      </Section>

      {hasActivity ? (
        <>
          <Section style={{ padding: '0 24px 24px' }}>
            <StatGrid stats={stats} />
          </Section>

          <Hr style={styles.divider} />

          <Section style={styles.content}>
            <Text style={styles.paragraph}>
              Open your dashboard to see your full equity curve, calendar heatmap, and trade breakdown.
            </Text>
            <EmailButton href={URLS.dashboard}>View full dashboard</EmailButton>
          </Section>
        </>
      ) : (
        <Section style={styles.content}>
          <Text style={styles.paragraph}>
            No trades logged this week. Even logging one trade keeps the habit alive and your data building.
          </Text>
          <EmailButton href={URLS.trades}>Log a trade</EmailButton>
        </Section>
      )}
    </EmailShell>
  )
}
