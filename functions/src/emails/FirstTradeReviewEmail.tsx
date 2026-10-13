import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { URLS } from './facts'

export function FirstTradeReviewEmail({ firstName, unsubscribeUrl }: { firstName: string; unsubscribeUrl?: string }) {
  return (
    <EmailShell preview="You’ve started your journal. Now capture the decision behind the result." unsubscribeUrl={unsubscribeUrl}>
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>Trade logged. What did you learn?</Heading>
        <Text style={styles.paragraph}>{firstName ? `${firstName}, you’ve` : 'You’ve'} started your journal. Whether you added a trade or imported your history, choose one recent trade and review <strong style={styles.strong}>the decision behind the result.</strong></Text>
        <Text style={styles.paragraph}>A winning trade can break your rules. A losing trade can follow them. <strong style={styles.strong}>Did you stick to your plan?</strong></Text>
        <EmailButton href={URLS.trades}>Review my trade</EmailButton>
      </Section>
      <NumberedSteps heading="Three notes worth keeping" steps={[
        <><strong>Why did you enter?</strong> Write down the setup and what you expected.</>,
        <><strong>Did you follow your rules?</strong> Note how you handled your entry, risk and exit.</>,
        <><strong>What would you repeat or change?</strong> Choose one specific action for your next review.</>,
      ]} />
      <Section className="email-content" style={styles.content}>
        <Text style={{ ...styles.paragraph, marginBottom: 0 }}>Keep recording your decisions alongside your results. Those notes will help you spot what to repeat and what to change as your history grows.</Text>
      </Section>
    </EmailShell>
  )
}
