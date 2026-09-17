import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, SectionLabel, styles } from './components'
import { ActivationCohort } from '../internal-report-data'
import { AutomationHealth } from '../automation-health'

export interface ActivationReportProps {
  cohorts: ActivationCohort[]
  excluded: number
  asOf: string
  automations?: AutomationHealth[]
  failedEmails?: { failed: number; subjects: string[] }
}

export function ActivationReportEmail({ cohorts, excluded, asOf, automations, failedEmails }: ActivationReportProps) {
  const mature = cohorts.filter(row => row.mature)
  const latest = mature[mature.length - 1]
  const previous = mature[mature.length - 2]
  const gap = latest && previous && latest.rate !== null && previous.rate !== null ? latest.rate - previous.rate : null
  return <EmailShell preview={latest ? `Seven-day activation: ${latest.rate}% for signups in the week of ${latest.week}.` : 'Waiting for a complete seven-day activation window.'} footerNote="Internal report · Firebase Auth signup dates and first-trade timestamps">
    <Section className="email-content" style={styles.content}>
      <SectionLabel>As of {asOf} UTC</SectionLabel>
      <Heading style={styles.h1}>Weekly activation</Heading>
      <Text style={styles.paragraph}>The share of new accounts that logged a first trade within seven days of signup.</Text>
      {latest ? <>
        <Text style={{ ...styles.h1, margin: '24px 0 8px' }}>{latest.rate}%</Text>
        <Text style={styles.paragraph}>{latest.activated} of {latest.signups} accounts in the signup week starting {latest.week}.</Text>
        {gap !== null && previous && <Text style={{ ...styles.fine, margin: 0 }}>{gap > 0 ? '+' : ''}{gap} percentage points compared with the prior reported cohort ({previous.week}, {previous.signups} accounts).</Text>}
      </> : <Text style={{ ...styles.fine, margin: 0 }}>No complete cohort is ready to compare yet.</Text>}
    </Section>
    {automations && automations.length > 0 && <>
      <Hr style={styles.divider} />
      <Section className="email-content" style={styles.content}>
        <SectionLabel>Onboarding emails, last seven days</SectionLabel>
        {automations.map(row => <Text key={row.name} style={{ ...styles.paragraph, margin: '0 0 8px', fontWeight: row.failed ? 700 : 400 }}>
          {row.name}: {row.failed === null ? 'could not be checked' : row.failed === 0 ? 'no failed sends' : `${row.failed} failed ${row.failed === 1 ? 'run' : 'runs'}. Open Resend and check the error.`}
        </Text>)}
        {failedEmails && <Text style={{ ...styles.paragraph, margin: '0 0 8px', fontWeight: failedEmails.failed ? 700 : 400 }}>
          Emails rejected after sending: {failedEmails.failed === 0 ? 'none' : `${failedEmails.failed} (${failedEmails.subjects.join('; ')}). Open the email in Resend to see the reason.`}
        </Text>}
      </Section>
    </>}
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <SectionLabel>Recent signup cohorts</SectionLabel>
      {cohorts.length === 0 && <Text style={styles.paragraph}>No eligible signups recorded.</Text>}
      {cohorts.slice(-9).map(row => <Section key={row.week} style={{ padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontWeight: 600 }}>Week of {row.week} · {row.mature ? `${row.rate}%` : 'Waiting'}</Text>
        <Text style={{ ...styles.fine, margin: 0 }}>{row.activated} activated within seven days / {row.signups} signups{row.mature ? '' : ' · observation window still open'}</Text>
      </Section>)}
    </Section>
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <Text style={{ ...styles.fine, margin: 0 }}>Weeks start Monday in UTC; this report includes signup cohorts from 29 June 2026 onward. A cohort is ready only after the full signup week plus seven observation days. Later first trades do not count toward this measure. {excluded} throttled accounts excluded. Historical accounts deleted from Auth are not included. Cohort differences can reflect traffic mix and sample size; this report does not establish the effect of a product change.</Text>
    </Section>
  </EmailShell>
}
