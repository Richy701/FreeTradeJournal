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
  'Turn on cloud sync in Settings so nothing lives only in one browser.',
]

export function TrialStartedEmail({ firstName, trialEndDate, unsubscribeUrl }: TrialStartedEmailProps) {
  return (
    <EmailShell
      preview={`Your ${TRIAL_DAYS}-day Pro trial has started. Every feature is unlocked — here is what to try first.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Eyebrow>{TRIAL_DAYS}-day free trial</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `Your trial has started, ${firstName}.` : 'Your trial has started.'}
        </Heading>
        <Text style={styles.paragraph}>
          Every Pro feature is unlocked until <strong style={styles.strong}>{trialEndDate}</strong>. No charge until then — and you can cancel anytime from Settings.
        </Text>
        <EmailButton href={URLS.dashboard}>Go to your dashboard</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading={`Get the most out of your ${TRIAL_DAYS} days`} steps={steps} />
    </EmailShell>
  )
}
