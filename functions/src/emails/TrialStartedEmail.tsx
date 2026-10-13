import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, NumberedSteps, styles } from './components'
import { URLS, TRIAL_DAYS } from './facts'

interface TrialStartedEmailProps {
  firstName: string
  trialEndDate: string
  unsubscribeUrl?: string
}

const steps = [
  'Log a trade or import your broker CSV — your data powers everything else.',
  'Open Coach FTJ and get your first AI trade review.',
  'Cloud sync is automatic. Check its status in Settings.',
]

export function TrialStartedEmail({ firstName, trialEndDate, unsubscribeUrl }: TrialStartedEmailProps) {
  return (
    <EmailShell
      preview={`Your ${TRIAL_DAYS}-day Pro trial has started. Every feature is unlocked — here is what to try first.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Eyebrow>{TRIAL_DAYS}-day free trial</Eyebrow>
        <Heading style={styles.h1}>
          Your Pro trial starts now!
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, every` : 'Every'} Pro feature is unlocked until <strong style={styles.strong}>{trialEndDate}</strong>. Try a trade review and check your goals with Coach FTJ. Cloud sync keeps your journal available across devices automatically.
        </Text>
        <Text style={styles.paragraph}><strong style={styles.strong}>No charge until your trial ends.</strong> To avoid a charge, cancel before {trialEndDate} in Settings → Subscription.</Text>
        <EmailButton href={URLS.dashboard}>Go to your dashboard</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading={`Get the most out of your ${TRIAL_DAYS} days`} steps={steps} />
    </EmailShell>
  )
}
