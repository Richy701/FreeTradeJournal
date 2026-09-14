import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, ProductPreview, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <EmailShell preview="Your journal is ready. Start with one trade or import your broker CSV.">
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          Welcome to FreeTradeJournal
        </Heading>
        <Text style={styles.paragraph}>{firstName ? `Hi ${firstName},` : 'Hi there,'}</Text>
        <Text style={styles.paragraph}>
          Thanks for signing up. You can add trades individually or import a CSV from your broker. Your dashboard will show the P&amp;L and win rate for the trades you log.
        </Text>
        <EmailButton href={URLS.dashboard}>Open your journal</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/coach-ftj-briefing.png`} alt="The FreeTradeJournal dashboard with trading statistics and Coach FTJ insights" caption="The FreeTradeJournal dashboard" />
    </EmailShell>
  )
}
