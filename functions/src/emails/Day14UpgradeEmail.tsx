import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, FeatureList, styles } from './components'
import { BASE_URL, URLS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

interface Day14UpgradeEmailProps {
  firstName: string
  tradeCount?: number
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'AI Trade Review', desc: 'Review what worked and what to improve in a trade.' },
  { label: 'PropTracker AI Analysis', desc: 'Review performance across your prop firm accounts.' },
  { label: 'AI Goal Coach', desc: 'Get coaching based on your goals and trading record.' },
  { label: 'Cloud Sync', desc: 'Keep your journal backed up across devices.' },
]

export function Day14UpgradeEmail({ firstName, tradeCount, unsubscribeUrl }: Day14UpgradeEmailProps) {
  const tradeLabel = tradeCount && tradeCount > 1
    ? `${tradeCount} trades`
    : 'your trades'

  return (
    <EmailShell
      preview="Pro includes additional AI coaching and cloud sync."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          What’s included in Pro
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, you` : 'You'} have started recording {tradeLabel}. If you want to access your journal on other devices, Pro includes cloud sync.
        </Text>
        <Text style={styles.paragraph}>
          It also includes more AI coaching for trade reviews, goals and prop firm accounts.
        </Text>
        <EmailButton href={URLS.pricing}>See Pro features</EmailButton>
        <Text style={styles.fine}>Pro is {PRICE_MONTHLY} or {PRICE_YEARLY}. Cancel anytime.</Text>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/proptracker-coach-tab.png`} alt="PropTracker account analysis" caption="PropTracker account analysis" />

      <Hr style={styles.divider} />

      <FeatureList heading="Pro features" items={proFeatures} />

    </EmailShell>
  )
}
