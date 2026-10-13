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
  multipleCurrencies?: boolean
  weekLabel: string
  unsubscribeUrl?: string
}

function pnlTone(value: string): Stat['toneHint'] {
  if (value.includes(' · ')) return undefined
  if (/^(?:[A-Z]{3} )?\+/.test(value)) return 'up'
  if (/^(?:[A-Z]{3} )?[-−]/.test(value)) return 'down'
  return undefined
}

export function WeeklyDigestEmail({ firstName, tradeCount, winRate, pnl, bestTrade, multipleCurrencies = false, weekLabel, unsubscribeUrl }: WeeklyDigestEmailProps) {
  const hasActivity = tradeCount > 0

  const stats: Stat[] = [
    { value: String(tradeCount), label: 'Trades' },
    { value: `${winRate}%`, label: 'Win rate' },
    { value: pnl, label: 'P&L', toneHint: pnlTone(pnl), money: true },
    { value: bestTrade, label: multipleCurrencies ? 'Best trade by currency' : 'Best trade', toneHint: pnlTone(bestTrade), money: true },
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
            ? 'Your week in trades.'
            : 'No trades logged this week.'
          }
        </Heading>
      </Section>

      {hasActivity ? (
        <>
          <Section className="email-content" style={{ ...styles.content, paddingTop: 0, paddingBottom: '24px' }}>
            <Text style={styles.paragraph}>{firstName ? `${firstName}, here` : 'Here'} is the record for this week. <strong style={styles.strong}>Start with the numbers, then revisit the decisions.</strong></Text>
            <StatGrid stats={stats} />
          </Section>

          <Hr style={styles.divider} />

          <Section className="email-content" style={styles.content}>
            <Text style={styles.paragraph}>
              Before your next session, choose <strong style={styles.strong}>one trade to review.</strong> Did you follow your entry, exit and risk rules? Read your notes alongside the result.
            </Text>
            <EmailButton href={URLS.dashboard}>Review my trading week</EmailButton>
          </Section>
        </>
      ) : (
        <Section className="email-content" style={{ ...styles.content, paddingTop: '16px' }}>
          <Text style={styles.paragraph}>
            {firstName ? `${firstName}, if` : 'If'} you traded this week, <strong style={styles.strong}>add those trades while the details are fresh.</strong> They’ll give your next review something to work with. Took the week off? There’s nothing to catch up on.
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
