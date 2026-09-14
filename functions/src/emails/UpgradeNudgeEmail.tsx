import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, FeatureList, styles } from './components'
import { BASE_URL, URLS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

interface UpgradeNudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'Review what worked and what to improve in a trade.' },
  { label: 'PropTracker AI Analysis', desc: 'Review performance across your prop firm accounts.' },
  { label: 'AI Goal Coach', desc: 'Get coaching based on your goals and trading record.' },
  { label: 'Cloud Sync', desc: 'Keep your journal backed up across devices.' },
]

export function UpgradeNudgeEmail({ firstName, unsubscribeUrl }: UpgradeNudgeEmailProps) {
  return (
    <EmailShell
      preview="Compare Pro features and pricing."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          AI coaching and cloud sync
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, Pro` : 'Pro'} gives you more AI coaching and keeps your journal synced across devices.
        </Text>
        <Text style={styles.paragraph}>
          See the included features below, or open the pricing page to compare plans.
        </Text>
        <EmailButton href={URLS.pricing}>See Pro features</EmailButton>
        <Text style={styles.fine}>Pro is {PRICE_MONTHLY} or {PRICE_YEARLY}. Cancel anytime.</Text>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/proptracker-coach-tab.png`} alt="PropTracker coaching for trading accounts" caption="PropTracker account analysis" />

      <Hr style={styles.divider} />

      <FeatureList heading="Included with Pro" items={proFeatures} />

    </EmailShell>
  )
}
