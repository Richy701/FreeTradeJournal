import { Section, Text, Heading, Link } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'

interface PasswordResetEmailProps {
  resetLink: string
}

export function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <EmailShell preview="Reset your FreeTradeJournal password">
      <Section style={styles.content}>
        <Heading style={styles.h1}>Reset your password</Heading>
        <Text style={styles.paragraph}>
          We received a request to reset the password for your FreeTradeJournal account. Click the button below to choose a new one.
        </Text>
        <EmailButton href={resetLink}>Reset password</EmailButton>
        <Text style={styles.fine}>
          If the button doesn't work, copy this link into your browser:
          <br />
          <Link href={resetLink} style={{ color: tone.muted, textDecoration: 'underline', wordBreak: 'break-all' as const }}>
            {resetLink}
          </Link>
        </Text>
        <Text style={styles.fine}>
          This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not change.
        </Text>
      </Section>
    </EmailShell>
  )
}
