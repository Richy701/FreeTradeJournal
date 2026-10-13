import { Section, Text, Heading, Link } from '@react-email/components'
import { EmailShell, EmailButton, ActionNote, styles, tone } from './components'

interface EmailVerificationEmailProps {
  verificationLink: string
  firstName: string
}

export function EmailVerificationEmail({ verificationLink, firstName }: EmailVerificationEmailProps) {
  return (
    <EmailShell preview="Verify your email to access FreeTradeJournal">
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>
          One step left: verify your email.
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, confirm` : 'Confirm'} that <strong style={styles.strong}>this email address belongs to you</strong> so you can access your trading journal.
        </Text>
        <ActionNote title="Verify your email to finish this step.">If this link has expired, request a new verification email.</ActionNote>
        <EmailButton href={verificationLink}>Verify email address</EmailButton>
        <Text style={styles.fine}>
          If the button doesn't work, copy this link into your browser:
          <br />
          <Link href={verificationLink} style={{ color: tone.muted, textDecoration: 'underline', wordBreak: 'break-all' as const }}>
            {verificationLink}
          </Link>
        </Text>
        <Text style={styles.fine}>
          <strong style={styles.strong}>Didn’t create an account?</strong> You can safely ignore this email.
        </Text>
      </Section>
    </EmailShell>
  )
}
