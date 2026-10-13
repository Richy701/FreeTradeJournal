import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS } from './facts'

interface ReferralEmailProps {
  /** True when this referral crossed the reward threshold. */
  rewardEarned: boolean
  newUserName: string
  /** Referrals still needed to unlock the reward (ignored when rewardEarned). */
  remaining: number
  rewardDays: number
}

export function ReferralEmail({ rewardEarned, newUserName, remaining, rewardDays }: ReferralEmailProps) {
  return (
    <EmailShell
      preview={rewardEarned
        ? `${newUserName} was the referral that unlocked ${rewardDays} days of Pro.`
        : `${newUserName} signed up with your link and logged their first trade.`}
    >
      <Section className="email-content" style={styles.content}>
        <Eyebrow>{rewardEarned ? 'Reward unlocked' : 'Referral confirmed'}</Eyebrow>
        {rewardEarned ? (
          <>
            <Heading style={styles.h1}>{rewardDays} days of Pro. You’ve earned them!</Heading>
            <Text style={styles.paragraph}>
              <strong style={styles.strong}>{newUserName}</strong> was the referral that unlocked your reward. <strong style={styles.strong}>Your Pro access is active for the next {rewardDays} days</strong>, including Pro coaching and cloud sync. Thanks for helping another trader get started!
            </Text>
          </>
        ) : (
          <>
            <Heading style={styles.h1}>Your referral counts!</Heading>
            <Text style={styles.paragraph}>
              <strong style={styles.strong}>{newUserName}</strong> signed up through your link and logged their first trade. You’re <strong style={styles.strong}>{remaining} confirmed referral{remaining !== 1 ? 's' : ''} away</strong> from {rewardDays} days of Pro, free.
            </Text>
          </>
        )}
        <EmailButton href={URLS.subscription}>View your referrals</EmailButton>
      </Section>
    </EmailShell>
  )
}
