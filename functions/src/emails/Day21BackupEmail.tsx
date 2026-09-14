import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, styles } from './components'
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
          {firstName ? `${firstName}, keep your journal safe.` : 'Keep your journal safe.'}
        </Heading>
        <Text style={styles.paragraph}>
          On the free plan, your journal is stored in this browser. If you have not saved a backup recently, now is a good time.
        </Text>
        <Text style={styles.paragraph}>
          Save a copy before clearing browser data or moving to another device.
        </Text>
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
