import { Section, Text, Heading, Hr, Img } from '@react-email/components'
import { EmailShell, EmailButton, styles, tone } from './components'
import { BASE_URL, URLS } from './facts'

interface AllAccountsAnnouncementEmailProps {
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

// Product-news announcement for the combined all-accounts view + calendar
// percent mode, both shipped 14 Aug 2026 (v2.78.0). Both came from a user
// request. Screenshots are served from the production site
// (public/screenshots/).
export function AllAccountsAnnouncementEmail({ firstName, unsubscribeUrl }: AllAccountsAnnouncementEmailProps) {
  return (
    <EmailShell
      preview="See every account combined in one view, and calendar days as percentages."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>All your accounts, one view</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, two` : 'Two'} things went live today. A trader asked for both, and they were good ideas. Both are free, on every plan.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '19px' }}>
          See every account combined
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/all-accounts-switcher.png`}
          alt="The account switcher open with the new All accounts option above two trading accounts"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          If you trade more than one account, each one has always been its own island. The account switcher in the sidebar now has an <strong style={styles.strong}>All accounts</strong> option. Pick it and the dashboard, trading calendar, trade log, and journal show everything together, so you can see your total P&amp;L in one place. Every trade in the log says which account it came from.
        </Text>
        <Text style={styles.paragraph}>
          The combined view is for looking, not editing: to add or change trades, switch back to a single account. And if your accounts use different currencies, you get one combined view per currency, since adding dollars to euros would give a meaningless total.
        </Text>
        <EmailButton href={URLS.dashboard}>See your accounts combined</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={{ ...styles.h1, fontSize: '19px' }}>
          Your calendar, in percentages
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/calendar-percent-mode.png`}
          alt="The trading calendar in percent mode, each day showing its return as a percentage"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          The $ / % switch on the dashboard now changes the trading calendar too. In percent mode, each day shows what you made or lost as a percentage of your starting balance, so a +$50 day on a small account and a +$500 day on a big one finally read the same way. Hover over any day and you see both the amount and the percentage.
        </Text>
        <Text style={styles.paragraph}>
          One tip: set your starting balance in Settings so the percentages are accurate.
        </Text>
        <EmailButton href={URLS.dashboard} variant="secondary">Open your dashboard</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.fine}>
          Both of these started as a suggestion from a trader who uses the app every day. If something about FreeTradeJournal should work differently for how you trade, reply to this email and tell me.
        </Text>
      </Section>
    </EmailShell>
  )
}
