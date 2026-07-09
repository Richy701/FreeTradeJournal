import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, TRIAL_DAYS } from './facts'

interface TrialAnnouncementEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const features = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your entire trading history.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts, and strategy tagging — no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'PDF reports and unlimited accounts', desc: 'Export polished trade reports, track every account and prop challenge.' },
]

export function TrialAnnouncementEmail({ firstName, unsubscribeUrl }: TrialAnnouncementEmailProps) {
  return (
    <EmailShell
      preview={`Your account now has ${TRIAL_DAYS} days of full Pro — free, no card needed.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Account upgrade</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, you've got ${TRIAL_DAYS} days of Pro. On us.` : `You've got ${TRIAL_DAYS} days of Pro. On us.`}
        </Heading>
        <Text style={styles.paragraph}>
          As of today, your FreeTradeJournal account has been upgraded to <strong style={styles.strong}>full Pro for {TRIAL_DAYS} days</strong> — every feature, no card, nothing to activate. When it ends, you simply go back to the free plan. Nothing is ever charged.
        </Text>
        <EmailButton href={URLS.dashboard}>Open your journal</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What just unlocked" items={features} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Why? Because the numbers only get useful once you can see all of them. Log your trades for the next two weeks and let the analytics and AI coach show you what they find.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
