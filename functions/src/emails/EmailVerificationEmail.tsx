import { Section, Text, Heading, Link } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'

interface EmailVerificationEmailProps {
  verificationLink: string
  firstName: string
}

export function EmailVerificationEmail({ verificationLink, firstName }: EmailVerificationEmailProps) {
  return (
    <EmailShell preview="Verify your email to access FreeTradeJournal">
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, verify your email` : 'Verify your email'}
        </Heading>
        <Text style={styles.paragraph}>
          Click the button below to confirm your email address and access your trading journal.
        </Text>
        <EmailButton href={verificationLink}>Verify email address</EmailButton>
        <Text style={styles.fine}>
          If the button doesn't work, copy this link into your browser:
          <br />
          <Link href={verificationLink} style={{ color: tone.muted, textDecoration: 'underline', wordBreak: 'break-all' as const }}>
            {verificationLink}
          </Link>
        </Text>
        <Text style={styles.fine}>
          This link expires in 24 hours. If you did not create a FreeTradeJournal account, you can safely ignore this email.
        </Text>
      </Section>
    </EmailShell>
  )
}
