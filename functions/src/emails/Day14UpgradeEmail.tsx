import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY, PRICE_LIFETIME } from './facts'

interface Day14UpgradeEmailProps {
  firstName: string
  tradeCount?: number
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'A personalised breakdown of each trade — what you did right, what cost you money, and what to do differently.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on your prop firms. Which are worth it, which are draining you, and what to do about it.' },
  { label: 'AI Goal Coach', desc: "Reads your actual trade data and tells you exactly where you're falling short of your targets." },
  { label: 'Cloud Sync', desc: 'Your trades, journal, and settings backed up across every device. Never lose your data.' },
]

export function Day14UpgradeEmail({ firstName, tradeCount, unsubscribeUrl }: Day14UpgradeEmailProps) {
  const tradeLabel = tradeCount && tradeCount > 1
    ? `${tradeCount} trades`
    : 'your trades'

  return (
    <EmailShell
      preview="You've been logging. Here's what Pro does with that data."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, you've` : "You've"} built two weeks of trading data.
        </Heading>
        <Text style={styles.paragraph}>
          You've been logging {tradeLabel} and building a real record of your performance. That puts you ahead of most traders.
        </Text>
        <Text style={styles.paragraph}>
          But logging trades is only half of it. Pro reads that data and turns it into actual coaching — telling you what's working, what's costing you, and where your edge is slipping.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What Pro does with your data" items={proFeatures} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Pro is <strong style={styles.strong}>{PRICE_MONTHLY}</strong>, {PRICE_YEARLY}, or {PRICE_LIFETIME}. Cancel anytime — everything you've logged stays exactly as it is.
        </Text>
        <EmailButton href={URLS.pricing}>See Pro features</EmailButton>
      </Section>
    </EmailShell>
  )
}
