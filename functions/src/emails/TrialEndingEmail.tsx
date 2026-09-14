import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS } from './facts'

interface TrialEndingEmailProps {
  firstName: string
  trialEndDate: string
  unsubscribeUrl?: string
}

export function TrialEndingEmail({ firstName, trialEndDate, unsubscribeUrl }: TrialEndingEmailProps) {
  return (
    <EmailShell
      preview={`Your Pro trial ends on ${trialEndDate}. Cancel before then and you will not be charged.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Eyebrow>Your trial is ending</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, your trial is ending.` : 'Your trial is ending.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your trial runs until <strong style={styles.strong}>{trialEndDate}</strong>. After that, your subscription renews automatically.
        </Text>
        <EmailButton href={URLS.subscription}>Manage subscription</EmailButton>
        <Text style={styles.fine}>
          If you want to cancel, go to <strong style={styles.strong}>Settings → Subscription</strong> before then — no charge if you cancel in time.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <EmailButton href={URLS.dashboard} variant="secondary">Open your journal</EmailButton>
      </Section>
    </EmailShell>
  )
}
