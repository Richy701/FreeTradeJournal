// Source for the Resend-hosted template `activation-import` (Onboarding:
// Activation Sequence automation). Not sent from index.ts — pushed with
// scripts/push-resend-templates.ts, which renders it with firstName '' so the
// headline is the plain form (Resend passes blank contact names through as "").
import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, NumberedSteps, ProductPreview, styles } from './components'
import { BASE_URL, URLS } from './facts'

interface ActivationImportEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const steps = [
  <><strong>Export your history.</strong> Download a CSV from your broker or trading platform.</>,
  <><strong>Open Trade Log → Import Trades.</strong> Upload the file and check the column mapping and time-zone settings.</>,
  <><strong>Review before importing.</strong> Check the trades, complete the import, then open your dashboard.</>,
]

export function ActivationImportEmail({ firstName, unsubscribeUrl }: ActivationImportEmailProps) {
  return (
    <EmailShell
      preview="Your broker already has the history. Bring it into your journal with a CSV."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section className="email-content" style={styles.content}>
        <Heading style={styles.h1}>Bring your trading history into your journal</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, you` : 'You'} don’t have to enter old trades one at a time. <strong style={styles.strong}>Import your broker’s CSV</strong> and put that history to work in your journal.
        </Text>
        <Text style={styles.paragraph}>Before you finish, check the dates and results. <strong style={styles.strong}>Accurate imports mean a more useful review.</strong></Text>
        <EmailButton href={URLS.trades}>Import my trades</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <NumberedSteps heading="Import in three steps" steps={steps} />

      <Hr style={styles.divider} />
      <Section className="email-content" style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '23px' }}>Have a screenshot instead?</Heading>
        <Text style={{ ...styles.paragraph, marginBottom: 0 }}>Trade Log also supports <strong style={styles.strong}>Import from Screenshot.</strong> Review the extracted rows, correct anything the AI misread, and select the trades you want to import.</Text>
      </Section>
      <ProductPreview src={`${BASE_URL}/screenshots/screenshot-import-review.png`} alt="Import from Screenshot review showing editable trade rows and selection checkboxes" caption="Screenshot import has its own review screen, shown here with demo trades." />

    </EmailShell>
  )
}
