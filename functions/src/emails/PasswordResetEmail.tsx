import { Section, Text, Heading, Link } from '@react-email/components'
import { EmailShell, EmailButton, ActionNote, styles, tone } from './components'

interface PasswordResetEmailProps {
  resetLink: string
}

export function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <EmailShell preview="Reset your FreeTradeJournal password">
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>Reset your password</Heading>
        <Text style={styles.paragraph}>
          We received a password reset request for your FreeTradeJournal account. <strong style={styles.strong}>Choose a new password</strong> using the button below.
        </Text>
        <ActionNote title="Use this link within 1 hour." urgent>After it expires, you’ll need to request another reset link.</ActionNote>
        <EmailButton href={resetLink}>Reset password</EmailButton>
        <Text style={styles.fine}>
          If the button doesn't work, copy this link into your browser:
          <br />
          <Link href={resetLink} style={{ color: tone.muted, textDecoration: 'underline', wordBreak: 'break-all' as const }}>
            {resetLink}
          </Link>
        </Text>
        <Text style={styles.fine}>
          <strong style={styles.strong}>Didn’t request this?</strong> You can safely ignore this email. Your password will not change unless you complete the reset.
        </Text>
      </Section>
    </EmailShell>
  )
}
