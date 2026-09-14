import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, Eyebrow, SectionLabel, styles, tone } from './components'

export interface InternalNotificationProps {
  title: string
  sender: string
  message: string
  wantsReply?: boolean
  details: { label: string; value: string }[]
  diagnostics?: Record<string, unknown>
  attachmentStatus?: string
  nextStep: string
}

export function InternalNotificationEmail(props: InternalNotificationProps) {
  return <EmailShell preview={`${props.title} from ${props.sender}${props.wantsReply ? ' · Reply requested' : ''}`} footerNote="Internal notification · FreeTradeJournal">
    <Section className="email-content" style={styles.content}>
      {props.wantsReply && <Eyebrow>Reply requested</Eyebrow>}
      <Heading style={styles.h1}>{props.title}</Heading>
      <Text style={styles.paragraph}>From {props.sender}</Text>
      <Section style={{ backgroundColor: tone.inset, padding: '20px' }}>
        <Text style={{ ...styles.paragraph, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{props.message}</Text>
      </Section>
      <Text style={{ ...styles.fine, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{props.nextStep}</Text>
      {props.attachmentStatus && <Text style={styles.fine}>{props.attachmentStatus}</Text>}
    </Section>
    <Hr style={styles.divider} />
    <Section className="email-content" style={styles.content}>
      <SectionLabel>Details</SectionLabel>
      {props.details.map(row => <Text key={row.label} style={{ ...styles.fine, margin: '0 0 12px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}><strong>{row.label}:</strong> {row.value}</Text>)}
    </Section>
    {props.diagnostics && Object.keys(props.diagnostics).length > 0 && <>
      <Hr style={styles.divider} />
      <Section className="email-content" style={styles.content}>
        <SectionLabel>Diagnostics</SectionLabel>
        {Object.entries(props.diagnostics).map(([key, value]) => <Text key={key} style={{ ...styles.fine, margin: '0 0 12px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}><strong>{key}:</strong> {String(value)}</Text>)}
      </Section>
    </>}
  </EmailShell>
}
