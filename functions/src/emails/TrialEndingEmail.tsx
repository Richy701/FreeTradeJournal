import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, ActionNote, styles } from './components'
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
          Your trial is ending. Check your next step.
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, your` : 'Your'} trial runs until <strong style={styles.strong}>{trialEndDate}</strong>. After that, <strong style={styles.strong}>your subscription renews automatically.</strong>
        </Text>
        <ActionNote title={`Don’t want to continue? Cancel before ${trialEndDate}.`} urgent>Open <strong style={styles.strong}>Settings → Subscription</strong> to manage your plan. You won’t be charged if you cancel before the trial ends.</ActionNote>
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
