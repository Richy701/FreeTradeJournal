import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { URLS } from './facts'

interface Day3NudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const steps = [
  'Go to Trade Log and click "Add Trade".',
  'Or hit "Import CSV" and drop in your broker export.',
  'Your dashboard, P&L curve, and win rate update instantly.',
]

export function Day3NudgeEmail({ firstName, unsubscribeUrl }: Day3NudgeEmailProps) {
  return (
    <EmailShell
      preview="You signed up a few days ago. Logging your first trade takes 60 seconds."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `Hey ${firstName}, your journal is waiting.` : 'Your journal is waiting.'}
        </Heading>
        <Text style={styles.paragraph}>
          You signed up a few days ago but have not logged a trade yet. It takes about <strong style={styles.strong}>60 seconds</strong>.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="How to log your first trade" steps={steps} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          It's completely free — no card, no trade limits. One logged trade is all it takes to see your first stats.
        </Text>
        <EmailButton href={URLS.trades}>Log my first trade</EmailButton>
      </Section>
    </EmailShell>
  )
}
