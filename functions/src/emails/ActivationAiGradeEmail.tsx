// Source for the Resend-hosted template `activation-ai-grade` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — render with
// firstName '__FIRSTNAME__' and replace with the Resend personalization tag
// before pushing via the Resend API.
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS } from './facts'

interface ActivationAiGradeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const gives = [
  { label: 'AI Trade Review', desc: 'A plain-English breakdown of every trade you log.' },
  { label: 'Your biggest leak', desc: "The pattern that's quietly costing you money." },
  { label: 'One concrete fix', desc: 'Exactly what to do differently next time.' },
]

export function ActivationAiGradeEmail({ firstName, unsubscribeUrl }: ActivationAiGradeEmailProps) {
  return (
    <EmailShell
      preview="See exactly what you did right and what cost you money."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Hey {firstName}, want your trades graded?</Heading>
        <Text style={styles.paragraph}>
          Log a single trade and FreeTradeJournal's AI coach reviews it instantly — what you did right, what cost you money, and the one thing to fix next time. It's free to try.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What your AI coach gives you" items={gives} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Logging one trade is all it takes to see your first AI review. It's free.
        </Text>
        <EmailButton href={URLS.trades}>Log a trade, get my grade</EmailButton>
      </Section>
    </EmailShell>
  )
}
