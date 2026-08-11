import { Section, Text, Heading, Hr, Img } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'
import { BASE_URL, URLS } from './facts'

interface FeatureAnnouncementEmailProps {
  firstName: string
  unsubscribeUrl?: string
}

const screenshot: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  borderRadius: '10px',
  border: `1px solid ${tone.divider}`,
  margin: '0 0 16px',
}

// Product-news announcement for the position size calculator + market
// sessions widget, both shipped 11 Aug 2026. Screenshots are served from the
// production site (public/screenshots/).
export function FeatureAnnouncementEmail({ firstName, unsubscribeUrl }: FeatureAnnouncementEmailProps) {
  return (
    <EmailShell
      preview="A position size calculator with an AI risk check, and live market sessions on your dashboard."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>Two new tools in your journal</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, two` : 'Two'} things went live this week. Both are free, on every plan.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '19px' }}>
          A position size calculator that knows your trading
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/position-calculator.png`}
          alt="The position size calculator showing 5 MNQ contracts for a $100 risk with a 40-tick stop"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          Enter your balance, how much you want to risk, and your stop loss. It tells you how many lots or contracts to trade. Forex pairs with live exchange rates, and futures with the real tick values — ES, NQ, crude, gold, and all the micros.
        </Text>
        <Text style={styles.paragraph}>
          The part no other calculator has: the <strong style={styles.strong}>AI risk check</strong> reads the plan against your own logged trades. It knows your win rate and your worst losing streak, so it can tell you things like "your worst streak of 6 would cost 12% of the account at this risk."
        </Text>
        <Text style={styles.paragraph}>
          It's in the sidebar as Position Calculator.
        </Text>
        <EmailButton href={`${BASE_URL}/calculator`}>Open the calculator</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '19px' }}>
          Market sessions, live on your dashboard
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/market-sessions-widget.png`}
          alt="The market sessions widget showing London and New York open on a 24-hour timeline"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          Sydney, Tokyo, London and New York on one timeline, in your own timezone, with a marker moving through the day. It shows what's open right now, when the next session starts, the CME futures schedule including the daily halt, and it warns you the day before market holidays.
        </Text>
        <Text style={styles.paragraph}>
          It's on your dashboard now. If you don't want it, hide it from Customize.
        </Text>
        <EmailButton href={URLS.dashboard} variant="secondary">Open your dashboard</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.fine}>
          Both tools are free and need nothing set up. The AI risk check uses your monthly AI allowance, the same as the coach.
        </Text>
      </Section>
    </EmailShell>
  )
}
