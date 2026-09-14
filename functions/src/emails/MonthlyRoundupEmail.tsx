import { Section, Text, Heading, Hr, Img, Link } from '@react-email/components'
import { EmailShell, EmailButton, SectionLabel, styles } from './components'
import { BASE_URL } from './facts'
import { monthLabel, publicUrl } from '../monthly-roundup-data'
import type { RoundupContent } from '../monthly-roundup-data'

export function MonthlyRoundupEmail({ content, unsubscribeUrl }: { content: RoundupContent; unsubscribeUrl?: string }) {
  return <EmailShell preview={content.preview} unsubscribeUrl={unsubscribeUrl}>
    <Section className="email-content" style={styles.content}>
      <SectionLabel>{monthLabel(content.month)}</SectionLabel>
      <Heading style={styles.h1}>What’s new in your journal</Heading>
      <Text style={styles.paragraph}>Here are this month’s updates to FreeTradeJournal.</Text>
      <EmailButton href={`${BASE_URL}/changelog`}>See all updates</EmailButton>
    </Section>
    {content.features.map(feature => <Section key={feature.id}>
      <Hr style={styles.divider} />
      <Section className="email-content" style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '23px' }}>{feature.text}</Heading>
        {feature.description && <Text style={styles.paragraph}>{feature.description}</Text>}
        {feature.image && <Img src={publicUrl(feature.image.src)} alt={feature.image.alt} width="536" style={{ width: '100%', height: 'auto', display: 'block', margin: '20px 0', borderRadius: '8px' }} />}
        {feature.link && <Link href={publicUrl(feature.link.to)} style={{ color: '#18181b', fontWeight: 600, textDecoration: 'underline', display: 'inline-block', padding: '12px 0', fontSize: '16px' }}>{feature.link.label}</Link>}
      </Section>
    </Section>)}
  </EmailShell>
}
