import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS } from './facts'

interface CancellationEmailProps {
  firstName: string
  endDate: string
  accessEnded?: boolean
}

export function CancellationEmail({ firstName, endDate, accessEnded = false }: CancellationEmailProps) {
  return (
    <EmailShell preview={accessEnded ? 'Your Pro subscription has ended. Your saved data is still there.' : `Your renewal is cancelled. Pro access continues until ${endDate}.`}>
      <Section className="email-content" style={styles.content}>
        <Eyebrow quiet>{accessEnded ? 'Subscription ended' : 'Renewal cancelled'}</Eyebrow>
        <Heading style={styles.h1}>
          {accessEnded ? 'Your Pro subscription has ended.' : 'Your renewal is cancelled.'}
        </Heading>
        <Text style={styles.paragraph}>
          {accessEnded ? 'Your subscription has ended and no longer provides Pro access. You can keep using your free journal.' : <>You will not be charged for another renewal. Your Pro access continues until <strong style={styles.strong}>{endDate}</strong>.</>}
        </Text>
        <Text style={styles.paragraph}>
          Your trades, journal, and goals are all still there. Nothing gets deleted.
        </Text>
        <EmailButton href={accessEnded ? URLS.pricing : URLS.subscription}>{accessEnded ? 'See Pro plans' : 'Manage subscription'}</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section className="email-content" style={styles.content}>
        <Text style={{ ...styles.fine, margin: 0 }}>{firstName ? `${firstName}, if` : 'If'} something was not working for you, reply and tell me. Your feedback helps me improve the journal.</Text>
      </Section>
    </EmailShell>
  )
}
