import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface Day3NudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const steps = [
  'Go to Trade Log and click "Add Trade".',
  'Or hit "Import CSV" and drop in your broker export.',
  'Your dashboard, P&L curve, and win rate update instantly.',
]

export function Day3NudgeEmail({ firstName, unsubscribeUrl }: Day3NudgeEmailProps) {
  return (
    <EmailShell
      preview="Add a trade manually or import your broker CSV."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, here’s how to add a trade.` : 'Here’s how to add a trade.'}
        </Heading>
        <Text style={styles.paragraph}>
          Open Trade Log and choose Add Trade. If you already have a trading history, you can import a CSV instead of entering each trade.
        </Text>
        <EmailButton href={URLS.trades}>Log my first trade</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/trade-form-refresh.png`} alt="The FreeTradeJournal trade-entry form" caption="Add Trade in FreeTradeJournal" />

      <Hr style={styles.divider} />

      <NumberedSteps heading="How to log your first trade" steps={steps} />

    </EmailShell>
  )
}
