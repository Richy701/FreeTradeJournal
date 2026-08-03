import { Section, Text, Heading, Hr } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, FeatureList, styles } from './components'
import { URLS, PRICE_LIFETIME } from './facts'

// Last-days lifetime send for accounts that joined AFTER the July waves and
// therefore never received a retirement email. The July 21 wave promised its
// recipients "I will not email you about this again" — this template must
// never be sent to anyone holding a foundingMemberEmailId or
// lifetimeRetirementEmailId flag.
interface LifetimeFinal48EmailProps {
  firstName?: string
  promoCode?: string
  offerPrice?: string
  pricingUrl?: string
  unsubscribeUrl?: string
}

const features = [
  { label: 'Full analytics history', desc: 'Every stat and chart across your entire trading history, not just the last 30 days.' },
  { label: 'Unlimited AI coaching', desc: 'Coach FTJ, trade reviews, risk alerts, and strategy tagging with no monthly cap.' },
  { label: 'Cloud sync', desc: 'Your journal backed up and available on every device.' },
  { label: 'Unlimited everything else', desc: 'Journal entries, trading accounts, PropTracker accounts, and PDF reports.' },
]

export function LifetimeFinal48Email({
  firstName,
  promoCode = 'FOUNDER149',
  offerPrice = '$149',
  pricingUrl = URLS.pricing,
  unsubscribeUrl,
}: LifetimeFinal48EmailProps) {
  return (
    <EmailShell
      preview={`Own Pro outright for ${offerPrice} — the lifetime plan comes off sale Friday night.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Ends Friday</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, the lifetime plan ends Friday.` : 'The lifetime plan ends Friday.'}
        </Heading>
        <Text style={styles.paragraph}>
          You joined FreeTradeJournal recently, so you may not know this option exists: instead of paying for Pro monthly, you can own it outright — one payment, every Pro feature, forever, including everything shipped in the future. That option ends this week. On <strong style={styles.strong}>Friday, August 7</strong> the Lifetime plan comes off the pricing page for good, and Pro becomes subscription only.
        </Text>
        <Text style={styles.paragraph}>
          Until then it is <strong style={styles.strong}>{offerPrice}</strong> with code <strong style={styles.strong}>{promoCode}</strong> at checkout, instead of {PRICE_LIFETIME}. And to be exact about the deadline, because time zones matter: sales close <strong style={styles.strong}>Friday, August 7 at 11:59 PM UTC</strong> — that is 7:59 PM in New York, 4:59 PM in Los Angeles, and Saturday 9:59 AM in Sydney. After that moment the code stops working and the plan is gone.
        </Text>
        <Text style={styles.paragraph}>
          If you are on the free 14-day Pro trial right now, this is what makes it permanent: everything you are currently using stays, for one payment.
        </Text>
        <EmailButton href={pricingUrl}>Get Lifetime Pro for {offerPrice}</EmailButton>
        <Text style={styles.fine}>
          Anyone who owns lifetime before the cutoff keeps it forever — this only changes what is for sale.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList heading="What lifetime Pro includes" items={features} />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          This is the only email I will send you about this. If lifetime is not for you, no hard feelings — the free journal stays free.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: '#f5f5f6', fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
