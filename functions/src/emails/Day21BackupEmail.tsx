import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, styles } from './components'
import { URLS, PRICE_MONTHLY, TRIAL_DAYS } from './facts'

interface Day21BackupEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const options = [
  'Export a backup now — go to Settings → Data Management → Export Backup and save the file somewhere safe.',
  'Enable cloud sync with Pro — your trades sync automatically across all your devices, so nothing lives in only one browser.',
]

export function Day21BackupEmail({ firstName, unsubscribeUrl }: Day21BackupEmailProps) {
  return (
    <EmailShell
      preview="Your trades are only saved in your browser. Here's how to protect them."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, your data isn't backed up.` : "Your data isn't backed up."}
        </Heading>
        <Text style={styles.paragraph}>
          You have been journaling for three weeks now — and your trades are only saved in your browser's local storage.
        </Text>
        <Text style={styles.paragraph}>
          That means <strong style={styles.strong}>clearing your browser data, using a different device, or even a browser update</strong> could wipe everything.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="Two ways to protect your data" steps={options} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Cloud sync is included in every Pro plan, starting at {PRICE_MONTHLY} with a <strong style={styles.strong}>{TRIAL_DAYS}-day free trial</strong>.
        </Text>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              <td><EmailButton href={URLS.pricing}>Enable cloud sync</EmailButton></td>
            </tr>
            <tr>
              <td style={{ paddingTop: '12px' }}>
                <EmailButton href={URLS.settings} variant="secondary">Export a backup</EmailButton>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
    </EmailShell>
  )
}
