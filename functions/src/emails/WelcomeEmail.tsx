import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, ProductPreview, ActionNote, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <EmailShell preview="Welcome! Bring in your trades, then give your next review something to work with.">
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          Welcome to FreeTradeJournal!
        </Heading>
        <Text style={styles.paragraph}>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Text>
        <Text style={styles.paragraph}>
          Glad you’re here. You’ve got a place to keep <strong style={styles.strong}>your trades, your reasoning and your results</strong> together, so your next review starts with a record you can trust.
        </Text>
        <ActionNote title="Start with your latest closed trade.">Add it to your journal while the decision is still fresh. Already have a trading history? <strong style={styles.strong}>Import your broker CSV</strong> to bring it with you.</ActionNote>
        <Section style={{ padding: '8px 0' }}>
          <EmailButton href={URLS.trades}>Add my first trade</EmailButton>
        </Section>
        <Text style={{ ...styles.paragraph, marginTop: '24px', marginBottom: 0 }}>One useful note to add: <strong style={styles.strong}>“Did I follow my plan?”</strong> Your dashboard tracks the numbers. Your notes help you understand the decisions behind them.</Text>
      </Section>
      <ProductPreview
        src={`${BASE_URL}/images/screenshots/trading-dashboard-screenshot.png`}
        alt="FreeTradeJournal demo dashboard showing P&L, win rate, total trades and profit factor"
        caption="Your dashboard brings your trading results together. Demo shown."
      />
    </EmailShell>
  )
}
