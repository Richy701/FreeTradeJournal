// Source for the Resend-hosted template `activation-proof` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — render with
// firstName '__FIRSTNAME__' and push with scripts/push-resend-templates.ts, which
// swaps in the declared {{{NAME}}} template variable.
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS } from './facts'

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
      preview="Keep a record of your trades and see the patterns for yourself."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>{firstName ? `${firstName}, review your trading results.` : 'Review your trading results.'}</Heading>
        <Text style={styles.paragraph}>
          Add your trades to compare results by setup and check your win rate. Include your notes so you can revisit why you took each trade.
        </Text>
        <EmailButton href={URLS.trades}>Start my journal</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="In your journal" items={reveals} />

    </EmailShell>
  )
}
