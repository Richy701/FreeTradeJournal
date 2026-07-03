import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles } from './components'
import { URLS } from './facts'

interface Day7NudgeEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const unlocks = [
  { label: 'Your real win rate', desc: 'Not what you think it is — what it actually is. Most traders are surprised.' },
  { label: 'P&L curve over time', desc: "See whether you're improving, plateauing, or giving back gains you don't notice." },
  { label: 'Which setups are working', desc: 'Your dashboard breaks down performance by symbol, session, and strategy tag.' },
]

export function Day7NudgeEmail({ firstName, unsubscribeUrl }: Day7NudgeEmailProps) {
  return (
    <EmailShell
      preview="A week in and no trades logged yet. Here's why that matters."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, a week in and no trades yet.` : 'A week in and no trades yet.'}
        </Heading>
        <Text style={styles.paragraph}>
          You signed up seven days ago but your journal is empty. That means no P&L curve, no win rate, no edge to build on.
        </Text>
        <Text style={styles.paragraph}>
          The traders who improve fastest are the ones who log everything — wins, losses, scratches. Not because it feels good, but because patterns only show up in the data.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What gets unlocked when you log" items={unlocks} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          It takes under two minutes. Log one trade and you'll see what I mean.
        </Text>
        <EmailButton href={URLS.trades}>Log my first trade</EmailButton>
      </Section>
    </EmailShell>
  )
}
