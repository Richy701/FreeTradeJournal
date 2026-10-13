import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, ActionNote, styles } from './components'
import { URLS, PRICE_MONTHLY } from './facts'

interface Day21BackupEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const options = [
  'Save a backup from Settings → Data and keep the file somewhere safe.',
  'Use Pro cloud sync to keep your journal backed up across your devices.',
]

export function Day21BackupEmail({ firstName, unsubscribeUrl }: Day21BackupEmailProps) {
  return (
    <EmailShell
      preview="Save a backup of your journal, or keep it synced with Pro."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          Before you clear your browser: back up.
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, on` : 'On'} the free plan, <strong style={styles.strong}>your journal is stored in the browser you use.</strong> Keep a separate copy of the trades and notes you want to protect.
        </Text>
        <ActionNote title="Clearing browser data? Switching devices?">Save a backup <strong style={styles.strong}>before you make the change.</strong> Open Settings → Data, export your journal and keep the file somewhere safe.</ActionNote>
        <EmailButton href={`${URLS.settings}?tab=data`}>Open backup settings</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="Two ways to protect your data" steps={options} />

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={styles.fine}>
          Cloud sync is included in every Pro plan, starting at {PRICE_MONTHLY}. Your subscription starts when you upgrade. Cancel anytime.
        </Text>
        <EmailButton href={URLS.pricing} variant="secondary">See Pro cloud sync</EmailButton>
      </Section>
    </EmailShell>
  )
}
