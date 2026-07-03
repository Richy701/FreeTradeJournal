import { Section, Text, Heading } from '@react-email/components'
import { Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS, FREE_AI_QUERIES_PER_MONTH } from './facts'

interface WelcomeEmailProps {
  firstName: string
}

const features = [
  { label: 'Trade log', desc: 'Unlimited trades — type them in or import a CSV from any broker in one go.' },
  { label: 'Analytics', desc: 'P&L curve, win rate, calendar heatmap, and breakdowns by symbol and setup.' },
  { label: 'AI coach', desc: `${FREE_AI_QUERIES_PER_MONTH} free AI queries a month — get any trade reviewed in plain English.` },
  { label: 'Goals & risk', desc: 'Set targets and risk rules that keep your discipline honest.' },
]

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <EmailShell preview="Most traders never track a single trade. You just changed that.">
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `Welcome, ${firstName}.` : 'Welcome.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your journal is set up. Track your trades, spot the patterns behind your wins and losses, and build the discipline most traders never develop.
        </Text>
        <EmailButton href={URLS.dashboard}>Open your journal</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What you can do for free" items={features} />
    </EmailShell>
  )
}
