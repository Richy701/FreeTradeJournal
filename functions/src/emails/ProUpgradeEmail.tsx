import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, ReceiptBlock, ReceiptRow, styles } from './components'
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

const features = [
  { label: 'AI coaching suite', desc: 'Trade reviews, goal coaching, and risk alerts — unlimited, read from your real data.' },
  { label: 'PropTracker', desc: 'Unlimited prop firm accounts with an honest AI verdict on each one.' },
  { label: 'Cloud sync', desc: 'Trades, journal, and settings backed up and synced across every device.' },
  { label: 'No limits', desc: 'Unlimited journal entries, trading accounts, and data exports.' },
]

export function ProUpgradeEmail({ firstName, planLabel, receipt }: ProUpgradeEmailProps) {
  return (
    <EmailShell preview="You are Pro. Every feature is unlocked and ready to use.">
      <Section style={styles.content}>
        <Eyebrow>{planLabel}</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `You're Pro now, ${firstName}.` : "You're Pro now."}
        </Heading>
        <Text style={styles.paragraph}>
          Every feature is unlocked. Your data now syncs to the cloud automatically — here's what else you just picked up.
        </Text>
        <EmailButton href={URLS.dashboard}>Go to your dashboard</EmailButton>
      </Section>

      {receipt && receipt.rows.length > 0 && (
        <>
          <Hr style={styles.divider} />
          <ReceiptBlock heading="Your receipt" rows={receipt.rows} receiptUrl={receipt.receiptUrl} />
        </>
      )}

      <Hr style={styles.divider} />

      <FeatureList heading="What's now unlocked" items={features} />
    </EmailShell>
  )
}
