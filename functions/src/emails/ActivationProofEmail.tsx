// Source for the Resend-hosted template `activation-proof` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — render with
// firstName '__FIRSTNAME__' and replace with the Resend personalization tag
// before pushing via the Resend API.
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS } from './facts'

interface ActivationProofEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const reveals = [
  { label: 'Your real win rate', desc: 'Not what it feels like — what it actually is.' },
  { label: 'Which setups pay', desc: 'And which ones quietly bleed you.' },
  { label: 'Your emotional patterns', desc: 'The state of mind behind your worst trades.' },
]

export function ActivationProofEmail({ firstName, unsubscribeUrl }: ActivationProofEmailProps) {
  return (
    <EmailShell
      preview="The traders who improve all keep a record. That's where the edge starts."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Hey {firstName}, here's the difference.</Heading>
        <Text style={styles.paragraph}>
          The traders who actually get better aren't smarter — they keep a record. Logging your trades is how you see what's working, cut what isn't, and stop repeating the same mistake.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What logging reveals" items={reveals} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          It starts with one trade. Log it and watch the picture build.
        </Text>
        <EmailButton href={URLS.trades}>Start my journal</EmailButton>
      </Section>
    </EmailShell>
  )
}
