// Source for the Resend-hosted template `activation-ai-grade` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — render with
// firstName '__FIRSTNAME__' and replace with the Resend personalization tag
// before pushing via the Resend API.
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
      preview="Use Coach FTJ to review the trades in your journal."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>{firstName ? `${firstName}, review your next trade.` : 'Review your next trade.'}</Heading>
        <Text style={styles.paragraph}>
          Log a trade, then open Coach FTJ to review it. The coach uses your journal data to suggest points to look at during your review.
        </Text>
        <EmailButton href={URLS.trades}>Log a trade to review</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/coach-ftj-briefing.png`} alt="Coach FTJ insights alongside trading statistics" caption="Coach FTJ on your dashboard" />

      <Hr style={styles.divider} />

      <FeatureList heading="What your AI coach gives you" items={gives} />

    </EmailShell>
  )
}
