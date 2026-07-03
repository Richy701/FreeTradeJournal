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
      <Section style={styles.content}>
        <Eyebrow>{rewardEarned ? 'Reward unlocked' : 'Referral confirmed'}</Eyebrow>
        {rewardEarned ? (
          <>
            <Heading style={styles.h1}>You just earned {rewardDays} days of Pro.</Heading>
            <Text style={styles.paragraph}>
              <strong style={styles.strong}>{newUserName}</strong> was the referral that did it. Your Pro access is now active — AI coaching, cloud sync, and everything else is unlocked for the next {rewardDays} days.
            </Text>
          </>
        ) : (
          <>
            <Heading style={styles.h1}>{newUserName} is trading with your link.</Heading>
            <Text style={styles.paragraph}>
              They signed up and logged their first trade. <strong style={styles.strong}>{remaining} more referral{remaining !== 1 ? 's' : ''}</strong> and you unlock {rewardDays} days of Pro, free.
            </Text>
          </>
        )}
        <EmailButton href={URLS.subscription}>View your referrals</EmailButton>
      </Section>
    </EmailShell>
  )
}
