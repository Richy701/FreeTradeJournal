import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, styles } from './components'
import { URLS, FREE_AI_COACHING_RUNS_PER_MONTH } from './facts'

interface AiCreditsResetEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

// One-off to free accounts that had used all 20 of the old shared AI credits
// this month. Shipped alongside v2.82.0 (18 Aug 2026): automatic AI stopped
// counting, the allowance became coaching-only, and every free account
// started the month with a full allowance again. Copy is deliberately
// generic — no per-user numbers (see feedback_no_user_data_in_outreach).
export function AiCreditsResetEmail({ firstName, unsubscribeUrl }: AiCreditsResetEmailProps) {
  return (
    <EmailShell
      preview="Your free AI credits are back. The way they were counted was wrong, and it is fixed."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Your AI credits are back</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, you` : 'You'} hit the free AI limit this month. That was mostly my fault, and it is fixed.
        </Text>
        <Text style={styles.paragraph}>
          Until today, the coaching tips on the dashboard, the journal questions that appear after you save a trade, and the risk alerts all came out of the same monthly allowance as everything else. The app fired those on its own, so people were running out of credits without ever choosing to use AI. I only saw how bad it was this week: about nine out of ten AI calls were ones the app started, not the trader.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '19px' }}>What changed</Heading>
        <Text style={styles.paragraph}>
          <strong style={styles.strong}>Automatic AI is now free.</strong> Coach FTJ tips, the journal prompts after a save, risk alerts and the on-save journal coach no longer use your credits on any account.
        </Text>
        <Text style={styles.paragraph}>
          <strong style={styles.strong}>Your allowance is now {FREE_AI_COACHING_RUNS_PER_MONTH} coaching runs a month</strong>, spent only when you ask for something: AI Trade Analysis, Trade Review, Journal Review, Goal Coach, Position Check, Strategy Tagger, PropTracker AI, or a message to Coach FTJ. Import first-reads have their own allowance of 20.
        </Text>
        <Text style={styles.paragraph}>
          <strong style={styles.strong}>Your credits for this month are restored.</strong> You start today with the full allowance.
        </Text>
        <EmailButton href={URLS.coach}>Open Coach FTJ</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.fine}>
          If the old limit stopped you doing something you wanted to do, reply to this email and tell me what it was. I read every reply.
        </Text>
      </Section>
    </EmailShell>
  )
}
