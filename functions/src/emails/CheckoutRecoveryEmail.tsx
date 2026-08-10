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
  { label: 'AI Trade Review', desc: 'A breakdown of every trade: what worked, what cost you, what to fix.' },
  { label: 'AI Goal Coach', desc: 'Reads your data and tells you exactly where you are falling short.' },
  { label: 'PropTracker AI Analysis', desc: 'An honest verdict on which prop firms are actually worth your money.' },
  { label: 'Cloud Sync', desc: 'Your journal backed up and available on every device.' },
]

export function CheckoutRecoveryEmail({ firstName, trialAvailable, unsubscribeUrl }: CheckoutRecoveryEmailProps) {
  return (
    <EmailShell
      preview="Nothing was charged. Here is where you left off."
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you started a Pro checkout on FreeTradeJournal. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>FreeTradeJournal Pro</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, you left before finishing.` : 'You left before finishing.'}
        </Heading>
        <Text style={styles.paragraph}>
          You started a Pro checkout but did not complete it. Nothing was charged and nothing changed on your account.
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

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          If something stopped you — the price, a missing feature, a card that would not go through — reply to this email and tell me. I read every one and I would rather fix the problem than send you another email.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
