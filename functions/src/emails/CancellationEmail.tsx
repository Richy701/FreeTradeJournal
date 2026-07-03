import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS } from './facts'

interface CancellationEmailProps {
  firstName: string
  endDate: string
}

export function CancellationEmail({ firstName, endDate }: CancellationEmailProps) {
  return (
    <EmailShell preview={`Your Pro access runs until ${endDate}. Your data stays safe.`}>
      <Section style={styles.content}>
        <Eyebrow quiet>Subscription cancelled</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `Sorry to see you go, ${firstName}.` : 'Sorry to see you go.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your Pro access runs until <strong style={styles.strong}>{endDate}</strong>. After that, your account moves to the free plan.
        </Text>
        <Text style={styles.paragraph}>
          Your trades, journal, and goals are all still there. Nothing gets deleted.
        </Text>
        <Text style={styles.paragraph}>
          If something wasn't working or a feature was missing, reply to this email and tell me — it goes straight to me, and it's how the product gets fixed.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>Changed your mind?</Text>
        <EmailButton href={URLS.pricing} variant="secondary">Resubscribe</EmailButton>
      </Section>
    </EmailShell>
  )
}
