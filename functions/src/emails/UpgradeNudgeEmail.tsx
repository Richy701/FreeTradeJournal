import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY, PRICE_LIFETIME } from './facts'

interface UpgradeNudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'A personalised breakdown of each trade. What you did right, what cost you money, and what to do next time.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on your prop firms. Which are profitable, which are draining you, and what to do about it.' },
  { label: 'AI Goal Coach', desc: "Reads your actual trading data and tells you exactly where you're falling short of your goals." },
  { label: 'Cloud Sync', desc: 'Your trades, journal, and settings backed up across every device. Never lose your data.' },
]

export function UpgradeNudgeEmail({ firstName, unsubscribeUrl }: UpgradeNudgeEmailProps) {
  return (
    <EmailShell
      preview="Turn your trades into personalised AI coaching."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, ready to` : 'Ready to'} get serious about your trading?
        </Heading>
        <Text style={styles.paragraph}>
          You signed up for FreeTradeJournal to take your trading seriously. Pro is where it gets powerful.
        </Text>
        <Text style={styles.paragraph}>
          It turns your trades into personalised AI coaching — the stuff that actually moves your numbers.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What you unlock with Pro" items={proFeatures} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Pro is <strong style={styles.strong}>{PRICE_MONTHLY}</strong> — or {PRICE_YEARLY}, or {PRICE_LIFETIME} if you never want to think about it again. Cancel anytime. Your free data stays exactly as it is.
        </Text>
        <EmailButton href={URLS.pricing}>See Pro features</EmailButton>
      </Section>
    </EmailShell>
  )
}
