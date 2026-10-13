// Source for the Resend-hosted template `activation-ai-grade` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — pushed with
// scripts/push-resend-templates.ts, which renders it with firstName '' so the
// headline is the plain form (Resend passes blank contact names through as "").
import { Section, Text, Heading, Hr } from '@react-email/components'
import { ProductPreview, EmailShell, EmailButton, FeatureList, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface ActivationAiGradeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const gives = [
  { label: 'AI Trade Review', desc: 'Ask for a plain-English breakdown of a logged trade.' },
  { label: 'Trading patterns', desc: 'Review recurring patterns in the trades you have logged.' },
  { label: 'Review suggestions', desc: 'Consider the suggestions alongside your own trading plan.' },
]

export function ActivationAiGradeEmail({ firstName, unsubscribeUrl }: ActivationAiGradeEmailProps) {
  return (
    <EmailShell
      preview="Bring a question to Coach FTJ. Use your logged trades to make the review specific."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>Your last trade. What can you learn?</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, the` : 'The'} result tells you what happened. A review helps you examine <strong style={styles.strong}>how you got there.</strong>
        </Text>
        <Text style={styles.paragraph}>Log your trades, then open Coach FTJ. Start with a question: <strong style={styles.strong}>“What should I look at more closely in my recent trading?”</strong> The coach uses your journal data to suggest points to review.</Text>
        <Text style={styles.paragraph}>Use those suggestions alongside <strong style={styles.strong}>your own trading plan and judgment.</strong></Text>
        <EmailButton href={URLS.coach}>Open Coach FTJ</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/coach-today-session.png`} alt="Coach FTJ showing session feedback, trading patterns and the Ask Coach FTJ field" caption="Session feedback and questions in Coach FTJ. Demo shown." />

      <Hr style={styles.divider} />

      <FeatureList heading="What your AI coach gives you" items={gives} />

    </EmailShell>
  )
}
