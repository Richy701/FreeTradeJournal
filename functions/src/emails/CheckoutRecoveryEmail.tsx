import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, TRIAL_DAYS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

interface CheckoutRecoveryEmailProps {
  firstName: string
  // False when the user has already used their one card trial —
  // the copy must not promise a trial they will not get at checkout.
  trialAvailable: boolean
  unsubscribeUrl?: string
}

const features = [
  { label: 'AI Trade Review', desc: 'Review what worked and what to improve in a trade.' },
  { label: 'AI Goal Coach', desc: 'Get coaching based on your goals and trading record.' },
  { label: 'PropTracker AI Analysis', desc: 'Review performance across your prop firm accounts.' },
  { label: 'Cloud Sync', desc: 'Keep your journal backed up across devices.' },
]

export function CheckoutRecoveryEmail({ firstName, trialAvailable, unsubscribeUrl }: CheckoutRecoveryEmailProps) {
  return (
    <EmailShell
      preview="Nothing was charged. Here is where you left off."
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you started a Pro checkout on FreeTradeJournal. Reply if you have questions — I read every one."
    >
      <Section className="email-content" style={styles.content}>
        <Eyebrow>FreeTradeJournal Pro</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, pick up where you left off.` : 'Pick up where you left off.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your Pro checkout was not completed. Nothing was charged, and your journal is still here.
        </Text>
        {trialAvailable ? (
          <Text style={styles.paragraph}>
            The <strong style={styles.strong}>{TRIAL_DAYS}-day free trial</strong> is still here if you want it. You will not be charged until the trial ends, and you can cancel any time before then.
          </Text>
        ) : (
          <Text style={styles.paragraph}>
            Pro is <strong style={styles.strong}>{PRICE_MONTHLY}</strong> or {PRICE_YEARLY}. Cancel anytime — everything you have logged stays exactly as it is.
          </Text>
        )}
        <EmailButton href={URLS.pricing}>
          {trialAvailable ? 'Pick up where you left off' : 'Finish upgrading'}
        </EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What you get with Pro" items={features} />

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={styles.paragraph}>
          Something stopped you? Reply with your question or what went wrong. I read every reply.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: styles.strong.color, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
