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
      preview="Stuck on an import or your first entry? Reply and tell me where."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          Need a hand getting started?
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, getting` : 'Getting'} a journal set up can raise a few questions. <strong style={styles.strong}>You can reply directly to this email.</strong>
        </Text>
        <Text style={styles.paragraph}>
          Having trouble with a broker CSV, finding the right fields, or deciding what to record? Tell me which step you’re on and what you expected to happen.
        </Text>
        <Text style={styles.paragraph}>Ready to try again? <strong style={styles.strong}>One closed trade is enough to begin.</strong></Text>
        <EmailButton href={URLS.trades}>Return to my journal</EmailButton>
      </Section>

    </EmailShell>
  )
}
