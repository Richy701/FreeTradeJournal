import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface Day3NudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const steps = [
  <><strong>Open Trade Log → Add Trade.</strong> Start with a closed trade you can still remember.</>,
  <><strong>Record the trade and its setup.</strong> Include the result, then add a note about your decision.</>,
  <><strong>Save it and open your dashboard.</strong> Your logged trades feed your P&amp;L and win rate.</>,
]

export function Day3NudgeEmail({ firstName, unsubscribeUrl }: Day3NudgeEmailProps) {
  return (
    <EmailShell
      preview="Add one closed trade, or bring your broker history with you."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          One trade or a CSV. Start your way.
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, you` : 'You'} don’t need to enter your entire history to get started. <strong style={styles.strong}>Pick one closed trade</strong> and follow the steps below.
        </Text>
        <Text style={styles.paragraph}><strong style={styles.strong}>Already have a broker export?</strong> Open Trade Log → Import Trades, upload your CSV, then check the column mapping, dates and results before finishing. No need to retype your history.</Text>
        <EmailButton href={URLS.trades}>Open my trade log</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/trade-form-refresh.png`} alt="The FreeTradeJournal trade-entry form" caption="Add Trade in FreeTradeJournal" />

      <Hr style={styles.divider} />

      <NumberedSteps heading="How to log your first trade" steps={steps} />

    </EmailShell>
  )
}
