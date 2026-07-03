import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS } from './facts'

interface TrialEndingEmailProps {
  firstName: string
  trialEndDate: string
  unsubscribeUrl?: string
}

export function TrialEndingEmail({ firstName, trialEndDate, unsubscribeUrl }: TrialEndingEmailProps) {
  return (
    <EmailShell
      preview={`Your Pro trial ends on ${trialEndDate}. Cancel before then and you will not be charged.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Eyebrow>Your trial is ending</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, your Pro trial ends in 2 days.` : 'Your Pro trial ends in 2 days.'}
        </Heading>
        <Text style={styles.paragraph}>
          Your trial runs until <strong style={styles.strong}>{trialEndDate}</strong>. After that, your subscription renews automatically.
        </Text>
        <Text style={styles.paragraph}>
          If you want to cancel, go to <strong style={styles.strong}>Settings → Subscription</strong> before then — no charge if you cancel in time.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>Ready to keep your edge?</Text>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              <td><EmailButton href={URLS.dashboard}>Continue with Pro</EmailButton></td>
            </tr>
            <tr>
              <td style={{ paddingTop: '12px' }}>
                <EmailButton href={URLS.subscription} variant="secondary">Manage subscription</EmailButton>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
    </EmailShell>
  )
}
