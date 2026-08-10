import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY, TRIAL_DAYS } from './facts'

interface TrialOpenEmailProps {
  firstName: string
  tradeCount?: number
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'A personalised breakdown of each trade. What you did right, what cost you money, and what to do next time.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on your prop firms. Which are profitable, which are draining you, and what to do about it.' },
  { label: 'AI Goal Coach', desc: "Reads your actual trading data and tells you exactly where you're falling short of your goals." },
  { label: 'Cloud Sync', desc: 'Your trades, journal, and settings backed up across every device. Never lose your data.' },
]

// Two variants off one template: users with a real trade record get their own
// number as the hook ("your 47 trades"); everyone else gets the plain
// trial-open message. The send script picks per recipient.
export function TrialOpenEmail({ firstName, tradeCount, unsubscribeUrl }: TrialOpenEmailProps) {
  const hasRecord = (tradeCount ?? 0) >= 5

  return (
    <EmailShell
      preview={hasRecord
        ? `You built the record. For ${TRIAL_DAYS} days, the AI coach reads it free.`
        : `Every Pro feature, free for ${TRIAL_DAYS} days. Every account qualifies now.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        {hasRecord ? (
          <>
            <Heading style={styles.h1}>
              Your {tradeCount} trades have something to tell you
            </Heading>
            <Text style={styles.paragraph}>
              {firstName ? `${firstName}, you` : 'You'}'ve logged {tradeCount} trades in FreeTradeJournal. That's a real record of how you trade. Most traders never build one.
            </Text>
            <Text style={styles.paragraph}>
              Pro's job is to read it. The AI coach goes through your trades and tells you what's working, what's quietly costing you money, and what to change next week. Not general advice. Your numbers.
            </Text>
            <Text style={styles.paragraph}>
              Until this month, most accounts couldn't try Pro without paying. That's fixed. Every account now gets {TRIAL_DAYS} days of Pro, free. You start it with a card, nothing is charged until day {TRIAL_DAYS}, and cancelling takes two clicks in Settings.
            </Text>
          </>
        ) : (
          <>
            <Heading style={styles.h1}>
              {firstName ? `${firstName}, you` : 'You'} can now try Pro free for {TRIAL_DAYS} days
            </Heading>
            <Text style={styles.paragraph}>
              Quick update. Pro now comes with a proper {TRIAL_DAYS}-day free trial, and every account qualifies — including accounts that had the short trial when they signed up. If you looked at Pro before and the trial wasn't available to you, that's fixed.
            </Text>
            <Text style={styles.paragraph}>
              You start it with a card, but nothing is charged until day {TRIAL_DAYS}. Cancel from Settings in two clicks before then and you pay nothing.
            </Text>
          </>
        )}
        <EmailButton href={URLS.pricing}>Start the free trial</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading={hasRecord ? 'What the trial unlocks on your data' : `What you get for the ${TRIAL_DAYS} days`} items={proFeatures} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          After the trial, Pro is <strong style={styles.strong}>{PRICE_MONTHLY}</strong> or {PRICE_YEARLY}. If you don't continue, your free plan and everything you've logged stay exactly as they are.
        </Text>
        <EmailButton href={URLS.pricing} variant="secondary">Start the free trial</EmailButton>
      </Section>
    </EmailShell>
  )
}
