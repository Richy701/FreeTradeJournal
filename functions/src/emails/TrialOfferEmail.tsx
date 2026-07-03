import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, TRIAL_DAYS } from './facts'

interface TrialOfferEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const features = [
  { label: 'AI Trade Review', desc: 'A breakdown of every trade: what worked, what cost you, what to fix.' },
  { label: 'AI Goal Coach', desc: 'Reads your data and tells you exactly where you are falling short.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on which prop firms are actually worth your money.' },
  { label: 'Cloud Sync', desc: 'Your journal backed up and available on every device.' },
]

export function TrialOfferEmail({ firstName, unsubscribeUrl }: TrialOfferEmailProps) {
  return (
    <EmailShell
      preview={`${TRIAL_DAYS} days of Pro, free. No catch, no commitment.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>For FreeTradeJournal users</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, here's ${TRIAL_DAYS} days of Pro on us.` : `Here's ${TRIAL_DAYS} days of Pro on us.`}
        </Heading>
        <Text style={styles.paragraph}>
          Start a Pro subscription and get <strong style={styles.strong}>{TRIAL_DAYS} days completely free</strong>. No charge until the trial ends — cancel any time before then and you will not pay a thing.
        </Text>
        <EmailButton href={URLS.pricing}>Claim your free trial</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What you get with Pro" items={features} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          If you have been journaling your trades you already have data worth analysing. The AI features will show you things you probably have not spotted yet.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
