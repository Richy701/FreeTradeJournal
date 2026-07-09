import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, PRICE_LIFETIME } from './facts'

interface FoundingMemberEmailProps {
  firstName: string
  /** Stripe promotion code the reader enters at checkout. */
  promoCode?: string
  /** Discounted lifetime price the code produces, e.g. "$149". */
  offerPrice?: string
  /** When the lifetime plan stops being sold, e.g. "next month". */
  retiresWhen?: string
  unsubscribeUrl?: string
}

const features = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your entire trading history, not just the last 30 days.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts, and strategy tagging with no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'Unlimited everything else', desc: 'Journal entries, trading accounts, PropTracker accounts, and PDF reports.' },
]

export function FoundingMemberEmail({
  firstName,
  promoCode = 'FOUNDER149',
  offerPrice = '$149',
  retiresWhen = 'next month',
  unsubscribeUrl,
}: FoundingMemberEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro is being retired — last chance to own it for ${offerPrice}.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Founding member offer</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, Lifetime Pro goes away ${retiresWhen}.` : `Lifetime Pro goes away ${retiresWhen}.`}
        </Heading>
        <Text style={styles.paragraph}>
          I am retiring the lifetime plan {retiresWhen} — after that, Pro will be subscription only. Before it goes, I want to give early users one last chance to own it outright: <strong style={styles.strong}>lifetime Pro for {offerPrice}</strong> instead of {PRICE_LIFETIME}. One payment, every Pro feature, forever — including everything we ship in the future.
        </Text>
        <Text style={styles.paragraph}>
          Use code <strong style={styles.strong}>{promoCode}</strong> at checkout on the Lifetime plan. Anyone who already owns lifetime keeps it forever — this only changes what is for sale.
        </Text>
        <EmailButton href={URLS.pricing}>Get Lifetime Pro for {offerPrice}</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What lifetime Pro includes" items={features} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          Why the discount? You were one of the first people to use FreeTradeJournal, and the journal is built by one person — founding members who own it outright are exactly whose feedback I want as it grows.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
