// Source for the Resend-hosted template `activation-proof` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — pushed with
// scripts/push-resend-templates.ts, which renders it with firstName '' so the
// headline is the plain form (Resend passes blank contact names through as "").
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, ProductPreview, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface ActivationProofEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const reveals = [
  { label: 'Win rate', desc: 'The percentage of logged trades that closed in profit.' },
  { label: 'Results by setup', desc: 'Compare the results of the strategies you record.' },
  { label: 'Trading notes', desc: 'Keep your reasoning and observations with each trade.' },
]

export function ActivationProofEmail({ firstName, unsubscribeUrl }: ActivationProofEmailProps) {
  return (
    <EmailShell
      preview="Look past a single win or loss. Compare the setups you’ve recorded."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>Which setups deserve another look?</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, a` : 'A'} memorable winner can feel more important than it really is. Your journal lets you look at <strong style={styles.strong}>the trades around it, too.</strong>
        </Text>
        <Text style={styles.paragraph}>Compare results by setup, check your win rate and read the notes behind the trades. Ask: <strong style={styles.strong}>“Am I repeating a sound decision, or just remembering a good result?”</strong></Text>
        <Text style={styles.fine}>Still building your history? Keep logging. A small number of trades is a starting point, not proof that a setup works.</Text>
        <EmailButton href={URLS.insights}>Review my setups</EmailButton>
      </Section>

      <ProductPreview src={`${BASE_URL}/screenshots/tag-performance.png`} alt="Trade Insights tables comparing tagged setups and the cost of recorded mistakes" caption="Compare tagged setups and mistakes in Trade Insights. Demo shown." />

      <Hr style={styles.divider} />

      <FeatureList heading="In your journal" items={reveals} />

    </EmailShell>
  )
}
