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
      <Section style={styles.content}>
        <Heading style={styles.h1}>Hey {firstName}, skip the manual entry.</Heading>
        <Text style={styles.paragraph}>
          If typing trades in is the holdup — don't. Export from your broker and import your whole history in one go. Two minutes and your journal is full.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="Import in three steps" steps={steps} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          No more excuses about time. Your trades are one upload away.
        </Text>
        <EmailButton href={URLS.trades}>Import my trades</EmailButton>
      </Section>
    </EmailShell>
  )
}
