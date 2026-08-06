import { Section, Text, Heading } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles } from './components'
import { URLS, PRICE_MONTHLY, PRICE_YEARLY } from './facts'

// Final-day lifetime send, Friday August 7 2026 — the closing note of the
// retirement sequence. Audience: the Aug 4 final-48h cohort plus anyone who
// signed up after it, and NEVER the July waves (their emails promised
// "I will not email you about this again" — anyone with foundingMemberEmailId
// or lifetimeRetirementEmailId is hard-excluded in the send script).
// Deliberately short: one state change, one price, one button.
interface LifetimeLastDayEmailProps {
  firstName?: string
  promoCode?: string
  offerPrice?: string
  pricingUrl?: string
  unsubscribeUrl?: string
}

export function LifetimeLastDayEmail({
  firstName,
  promoCode = 'FOUNDER149',
  offerPrice = '$149',
  pricingUrl = URLS.pricing,
  unsubscribeUrl,
}: LifetimeLastDayEmailProps) {
  return (
    <EmailShell
      preview={`Lifetime Pro ends tonight — ${offerPrice} once, Pro forever.`}
      unsubscribeUrl={unsubscribeUrl}
      footerNote="You are receiving this because you have a FreeTradeJournal account. Reply if you have questions — I read every one."
    >
      <Section style={styles.content}>
        <Eyebrow>Ends tonight</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, Lifetime Pro goes away tonight.` : 'Lifetime Pro goes away tonight.'}
        </Heading>
        <Text style={styles.paragraph}>
          Sales close <strong style={styles.strong}>tonight at 11:59 PM UTC</strong> — that is 7:59 PM in
          New York, 4:59 PM in Los Angeles, and Saturday 9:59 AM in Sydney. After that moment the plan is
          gone and the code stops working.
        </Text>
        <Text style={styles.paragraph}>
          Pay <strong style={styles.strong}>{offerPrice}</strong> once and you have Pro forever — no
          subscription, nothing else to pay, ever. That is the founding price: use code{' '}
          <strong style={styles.strong}>{promoCode}</strong> at checkout and $249 becomes {offerPrice}.
        </Text>
        <Text style={styles.paragraph}>
          After tonight the only way to get Pro is {PRICE_MONTHLY} or {PRICE_YEARLY}. If you have been on
          the fence, this is the moment.
        </Text>
        <EmailButton href={pricingUrl}>Get Lifetime Pro for {offerPrice}</EmailButton>
        <Text style={styles.fine}>
          Anyone who owns lifetime before the cutoff keeps it forever — this only changes what is for sale.
        </Text>
      </Section>
    </EmailShell>
  )
}
