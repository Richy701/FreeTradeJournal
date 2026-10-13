import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, FeatureList, styles } from './components'
import { BASE_URL, URLS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

interface Day14UpgradeEmailProps {
  firstName: string
  tradeCount?: number
  unsubscribeUrl?: string
}

const proFeatures = [
  { label: 'Review a decision', desc: 'Use AI Trade Review to examine a logged trade and identify points worth revisiting.' },
  { label: 'Review your prop accounts', desc: 'Bring your recorded account performance into PropTracker AI Analysis.' },
  { label: 'Connect results to goals', desc: 'Use AI Goal Coach to review your trading record against the goals you set.' },
  { label: 'Keep your journal with you', desc: 'Cloud sync gives you access to your journal across devices.' },
]

export function Day14UpgradeEmail({ firstName, tradeCount, unsubscribeUrl }: Day14UpgradeEmailProps) {
  return (
    <EmailShell
      preview="More coaching when you want a review. Cloud sync when you switch devices."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          Ready to get more from your journal?
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, if` : 'If'} you want more help reviewing your trading, <strong style={styles.strong}>Pro adds coaching for trades, goals and prop firm accounts.</strong> It also keeps your journal in sync across devices.
        </Text>
        <Text style={styles.paragraph}>
          {tradeCount !== undefined && tradeCount > 0 ? <>You’ve recorded <strong style={styles.strong}>{tradeCount} {tradeCount === 1 ? 'trade' : 'trades'}</strong>. Use that history as the starting point for a review.</> : <>Start with the problem you want to solve: <strong style={styles.strong}>a trade you want to understand, a goal you want to review, or a journal you need on another device.</strong></>}
        </Text>
        <EmailButton href={URLS.pricing}>Compare Pro plans</EmailButton>
        <Text style={styles.fine}><strong style={styles.strong}>{PRICE_MONTHLY}</strong> or <strong style={styles.strong}>{PRICE_YEARLY}</strong>. Your subscription starts when you upgrade. Cancel anytime.</Text>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/proptracker-coach-tab.png`} alt="PropTracker account analysis" caption="PropTracker account analysis" />

      <Hr style={styles.divider} />

      <FeatureList heading="Pro features" items={proFeatures} />

    </EmailShell>
  )
}
