import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, PRICE_LIFETIME } from './facts'

interface LifetimeRetirementEmailProps {
  firstName?: string
  /** Stripe promotion code the reader enters at checkout. */
  promoCode?: string
  /** Discounted lifetime price the code produces, e.g. "$149". */
  offerPrice?: string
  /** The hard date the lifetime plan stops being sold, e.g. "August 7". */
  retiresOn?: string
  /** Checkout link — campaign sends append UTM params for click attribution. */
  pricingUrl?: string
  unsubscribeUrl?: string
}

const features = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your entire trading history, not just the last 30 days.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts, and strategy tagging with no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'Unlimited everything else', desc: 'Journal entries, trading accounts, PropTracker accounts, and PDF reports.' },
]

export function LifetimeRetirementEmail({
  firstName,
  promoCode = 'FOUNDER149',
  offerPrice = '$149',
  retiresOn = 'August 7',
  pricingUrl = URLS.pricing,
  unsubscribeUrl,
}: LifetimeRetirementEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro stops being sold on ${retiresOn}. Own it for ${offerPrice} before it goes.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Final call</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, Lifetime Pro retires on ${retiresOn}.` : `Lifetime Pro retires on ${retiresOn}.`}
        </Heading>
        <Text style={styles.paragraph}>
          This is the date, not a teaser: on <strong style={styles.strong}>{retiresOn}</strong> the Lifetime plan comes off the pricing page for good, and Pro becomes subscription only. Until then, early users can still own it outright — <strong style={styles.strong}>lifetime Pro for {offerPrice}</strong> instead of {PRICE_LIFETIME}. One payment, every Pro feature, forever, including everything we ship in the future.
        </Text>
        <Text style={styles.paragraph}>
          Use code <strong style={styles.strong}>{promoCode}</strong> at checkout on the Lifetime plan. The code stops working on {retiresOn} too. Anyone who already owns lifetime keeps it forever — this only changes what is for sale.
        </Text>
        <EmailButton href={pricingUrl}>Get Lifetime Pro for {offerPrice}</EmailButton>
        <Text style={styles.fine}>
          After {retiresOn}, the only way to get these features is a subscription — and the math is simple: lifetime pays for itself in under a year of monthly Pro.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What lifetime Pro includes" items={features} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          I will not email you about this again — this is the last reminder before the plan goes away. If lifetime is not for you, no hard feelings; the free journal stays free.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
