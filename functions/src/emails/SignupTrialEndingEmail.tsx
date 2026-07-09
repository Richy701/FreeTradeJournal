import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

interface SignupTrialEndingEmailProps {
  firstName: string
  trialEndDate: string
  unsubscribeUrl?: string
}

const losing = [
  { label: 'Full analytics history', desc: 'Free shows your last 30 days; Pro keeps every stat across your whole history.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, and risk alerts drop back to 20 free queries a month.' },
  { label: 'Cloud sync', desc: 'Your journal stops syncing across devices; data stays local to this browser.' },
]

export function SignupTrialEndingEmail({ firstName, trialEndDate, unsubscribeUrl }: SignupTrialEndingEmailProps) {
  return (
    <EmailShell
      preview={`Your free Pro trial ends on ${trialEndDate} — nothing will be charged.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Eyebrow>Your trial is ending</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, your free Pro trial ends soon.` : 'Your free Pro trial ends soon.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your trial runs until <strong style={styles.strong}>{trialEndDate}</strong>. There is no card on file and nothing will be charged — your account simply switches to the free plan. Everything you have logged stays yours.
        </Text>
        <EmailButton href={URLS.pricing}>Keep Pro</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What switches off with the free plan" items={losing} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Keeping it is {PRICE_MONTHLY} or {PRICE_YEARLY} — cancel anytime from Settings.
        </Text>
      </Section>
    </EmailShell>
  )
}
