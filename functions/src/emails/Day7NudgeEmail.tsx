import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, styles } from './components'
import { URLS } from './facts'

interface Day7NudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

export function Day7NudgeEmail({ firstName, unsubscribeUrl }: Day7NudgeEmailProps) {
  return (
    <EmailShell
      preview="Start with a recent trade. Your first stats will follow."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, start with one trade.` : 'Start with one trade.'}
        </Heading>
        <Text style={styles.paragraph}>
          Pick a recent trade — a win, a loss or a scratch. Log it to start building your P&L curve and win rate.
        </Text>
        <Text style={styles.paragraph}>
          You can add the rest gradually or import your broker history in one go.
        </Text>
        <EmailButton href={URLS.trades}>Log my first trade</EmailButton>
      </Section>

    </EmailShell>
  )
}
