import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, ReceiptBlock, ReceiptRow, ActionNote, styles } from './components'
import { URLS } from './facts'

export interface ReceiptDetails {
  rows: ReceiptRow[]
  receiptUrl?: string
}

interface ProUpgradeEmailProps {
  firstName: string
  planLabel: string
  receipt?: ReceiptDetails
}

export function ProUpgradeEmail({ firstName, planLabel, receipt }: ProUpgradeEmailProps) {
  return (
    <EmailShell preview="Your Pro access is active.">
      <Section className="email-content" style={styles.content}>
        <Eyebrow>{planLabel}</Eyebrow>
        <Heading style={styles.h1}>
          You’re on Pro!
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `Thanks, ${firstName}! Your` : 'Your'} <strong style={styles.strong}>{planLabel}</strong> plan is active. You can now use Pro coaching to review your trades, goals and prop firm accounts.
        </Text>
        <ActionNote title="Cloud sync is automatic.">Your Pro journal syncs across devices. You can check its status in <strong style={styles.strong}>Settings</strong>. Bring a trade or a question to Coach FTJ when you’re ready.</ActionNote>
        <EmailButton href={URLS.dashboard}>Go to your dashboard</EmailButton>
      </Section>

      {receipt && receipt.rows.length > 0 && (
        <>
          <Hr style={styles.divider} />
          <ReceiptBlock heading="Your receipt" rows={receipt.rows} receiptUrl={receipt.receiptUrl} />
        </>
      )}

    </EmailShell>
  )
}
