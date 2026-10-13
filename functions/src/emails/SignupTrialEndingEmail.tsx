import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY, FREE_AI_COACHING_RUNS_PER_MONTH } from './facts'

interface SignupTrialEndingEmailProps {
  firstName: string
  trialEndDate: string
  unsubscribeUrl?: string
}

const losing = [
  { label: 'Full analytics history', desc: 'Free shows your last 30 days; Pro keeps every stat across your whole history.' },
  { label: 'Unlimited AI coaching', desc: `Coaching runs you ask for drop back to ${FREE_AI_COACHING_RUNS_PER_MONTH} a month. Automatic tips, journal prompts and risk alerts stay free.` },
  { label: 'Cloud sync', desc: 'Your journal stops syncing across devices; data stays local to this browser.' },
]

export function SignupTrialEndingEmail({ firstName, trialEndDate, unsubscribeUrl }: SignupTrialEndingEmailProps) {
  return (
    <EmailShell
      preview={`Your free Pro trial ends on ${trialEndDate} — nothing will be charged.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Eyebrow>Your trial is ending</Eyebrow>
        <Heading style={styles.h1}>
          Pro ends soon. Your free journal stays.
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, your` : 'Your'} trial ends on <strong style={styles.strong}>{trialEndDate}</strong>. There is no card on file: <strong style={styles.strong}>nothing will be charged.</strong> Your account switches to the free plan, and everything you’ve logged stays yours.
        </Text>
        <EmailButton href={URLS.pricing}>Keep Pro</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What changes when your trial ends" items={losing} />

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={styles.paragraph}>
          Want to keep Pro? Choose <strong style={styles.strong}>{PRICE_MONTHLY}</strong> or <strong style={styles.strong}>{PRICE_YEARLY}</strong>. Cancel anytime from Settings.
        </Text>
      </Section>
    </EmailShell>
  )
}
