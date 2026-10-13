// Service notice sent by the retentionSweep function (index.ts) before an
// inactive account is removed. Sent to everyone in scope regardless of
// marketing opt-out: it is about their account, not a promotion.
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, ActionNote, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface InactiveAccountWarningEmailProps {
  firstName: string
  /** Formatted date, e.g. "26 October 2026". */
  deleteDate: string
  /** True for the last reminder a week before the date. */
  final: boolean
  /** True when the account has logged trades (journal on their device). */
  hasTrades: boolean
}

export function InactiveAccountWarningEmail({ firstName, deleteDate, final, hasTrades }: InactiveAccountWarningEmailProps) {
  const heading = final ? 'Final reminder: keep your account.' : 'Want to keep your account?'

  const steps = hasTrades
    ? [
        'Sign in once. That is all it takes to keep the account.',
        'Open Settings and choose Export data to save a copy of your journal.',
        'If you no longer want the account, you can ignore this email.',
      ]
    : [
        'Sign in once. That is all it takes to keep the account.',
        'If you no longer want the account, you can ignore this email.',
      ]

  return (
    <EmailShell preview={`Sign in before ${deleteDate} to keep your FreeTradeJournal account.`}>
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>{heading}</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, you` : 'You'} haven’t signed in for a long time. <strong style={styles.strong}>Signing in once is all it takes to keep your account.</strong>
        </Text>
        <ActionNote title={`Sign in before ${deleteDate}.`} urgent>{final && <strong style={styles.strong}>This is your last reminder. </strong>}If you do not sign in by that date, <strong style={styles.strong}>your account and everything stored with it will be deleted.</strong></ActionNote>
        {hasTrades ? (
          <Text style={styles.paragraph}>
            Your journal is stored on the device you used, locked to this account. <strong style={styles.strong}>Once the account is gone, that journal cannot be opened again.</strong> Save a backup first if you want to keep it.
          </Text>
        ) : null}
        <EmailButton href={`${BASE_URL}/login`}>Sign in to keep my account</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="What to do" steps={steps} />

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={styles.fine}>
          Why this email: we keep accounts only while they are in use. You can read the full policy at {URLS.privacy}. If you have a question, reply to this email.
        </Text>
      </Section>
    </EmailShell>
  )
}
