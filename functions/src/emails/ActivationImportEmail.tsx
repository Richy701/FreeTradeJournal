// Source for the Resend-hosted template `activation-import` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — render with
// firstName '__FIRSTNAME__' and replace with the Resend personalization tag
// before pushing via the Resend API.
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { URLS } from './facts'

interface ActivationImportEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const steps = [
  'Export a CSV from Tradovate, MT4/MT5, or most brokers.',
  'Drag it in and map your columns once.',
  'Every trade, your P&L curve, and win rate populate instantly.',
]

export function ActivationImportEmail({ firstName, unsubscribeUrl }: ActivationImportEmailProps) {
  return (
    <EmailShell
      preview="Drop in your broker export and backfill your whole history at once."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>{firstName ? `${firstName}, skip the manual entry.` : 'Skip the manual entry.'}</Heading>
        <Text style={styles.paragraph}>
          Bring your trading history with you. Export a CSV from your broker, then import it into your journal in one go.
        </Text>
        <EmailButton href={URLS.trades}>Import my trades</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="Import in three steps" steps={steps} />

    </EmailShell>
  )
}
