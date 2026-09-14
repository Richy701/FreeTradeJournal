import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, ReceiptBlock, ReceiptRow, styles } from './components'
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
    <EmailShell preview="Your Pro subscription is active.">
      <Section className="email-content" style={styles.content}>
        <Eyebrow>{planLabel}</Eyebrow>
        <Heading style={styles.h1}>
          Your Pro subscription is active
        </Heading>
        <Text style={styles.paragraph}>
          {firstName ? `Thanks, ${firstName}. Your` : 'Your'} account now has Pro access, including additional AI coaching and cloud sync.
        </Text>
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
