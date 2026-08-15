import { Section, Text, Heading, Hr, Img } from '@react-email/components'
import { EmailShell, EmailButton, FeatureList, styles, tone } from './components'
import { BASE_URL, URLS } from './facts'

interface AugustUpdateEmailProps {
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

const h2: React.CSSProperties = { ...styles.h1, fontSize: '19px' }

// Product-news roundup for everything shipped 14–17 Aug 2026 (v2.78 – v2.80):
// the trade form refresh, combined all-accounts view, the Goals & Risk
// rebuild with app-wide limit alerts, plus the smaller changes. Replaces the
// narrower all-accounts-only announcement that was armed for the same slot.
// Screenshots are served from the production site (public/screenshots/).
export function AugustUpdateEmail({ firstName, unsubscribeUrl }: AugustUpdateEmailProps) {
  return (
    <EmailShell
      preview="Faster trade logging, one view of all your accounts, and a rebuilt Goals & Risk page."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Heading style={styles.h1}>What changed this month</Heading>
        <Text style={styles.paragraph}>
          {firstName ? `${firstName}, a` : 'A'} lot went live in the last few days. Here are the three you will notice first, and a short list of the rest. Everything below is free, on every plan.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={h2}>
          Logging a trade is faster
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/trade-form-refresh.png`}
          alt="The Add New Trade form with Long and Short buttons, pre-filled times, and empty price fields with example placeholders"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          Long and Short are now two buttons instead of a dropdown. Price fields start empty so you type straight away, and entry and exit times are pre-filled with the current time, so a quick log needs no date picking at all. Money fields show your currency, and an estimated P&amp;L appears next to the save button before you commit.
        </Text>
        <Text style={styles.paragraph}>
          If you submit with something missing, the form now tells you what it was instead of silently doing nothing.
        </Text>
        <EmailButton href={URLS.trades}>Log a trade</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={h2}>
          All your accounts, one view
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/all-accounts-switcher.png`}
          alt="The account switcher open with the new All accounts option above two trading accounts"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          If you trade more than one account, each one has always been its own island. The account switcher in the sidebar now has an <strong style={styles.strong}>All accounts</strong> option. Pick it and the dashboard, trading calendar, trade log, and journal show everything together, so you can see your total P&amp;L in one place.
        </Text>
        <Text style={styles.paragraph}>
          The combined view is for looking, not editing: switch back to a single account to add or change trades. Accounts in different currencies get one combined view per currency.
        </Text>
        <EmailButton href={URLS.dashboard} variant="secondary">See your accounts combined</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Heading as="h2" style={h2}>
          Goals &amp; Risk, rebuilt
        </Heading>
        <Img
          src={`${BASE_URL}/screenshots/goals-risk-redesign.png`}
          alt="The redesigned Goals & Risk page with risk limit cards on top and goal cards with recent history below"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          The page is one screen now, no tabs. Your risk limits sit at the top with today&apos;s usage against each cap. Your goals sit below with the actual number against each target, and each goal shows your recent record, like hit 4 of the last 6 weeks, so you can see consistency, not just today. Goals reset with their period instead of staying marked achieved forever.
        </Text>
        <Text style={styles.paragraph}>
          The bigger change is not on the page. <strong style={styles.strong}>Risk limit alerts now follow you around the app.</strong> Cross a daily loss, per-trade loss, or drawdown limit and you get an alert the moment it happens, whether you are in the trade log, the calendar, or importing a CSV. Before, you only found out if you opened the Goals page.
        </Text>
        <EmailButton href={`${BASE_URL}/goals`} variant="secondary">Open Goals &amp; Risk</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <FeatureList
        heading="Also this month"
        items={[
          {
            label: 'The trading calendar can show percentages',
            desc: 'The $ / % switch on the dashboard now changes the calendar too. Each day shows its return as a percentage of your starting balance. Set your starting balance in Settings so the numbers are accurate.',
          },
          {
            label: 'Market Sessions on the weekend',
            desc: 'Instead of four empty bars and "all sessions closed", the widget now says when the first session reopens and previews Monday’s schedule in your time.',
          },
          {
            label: 'Trading Wrapped can report on last month',
            desc: 'The PDF report has a Last month option, so you can generate a finished month’s recap without setting custom dates.',
          },
          {
            label: 'Faster goal and limit forms',
            desc: 'Setting a goal or a risk limit is a few taps: pick the type, pick the period, tap a suggested amount or type your own. Limit suggestions are sized from your account.',
          },
        ]}
      />

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.fine}>
          Two of these started as a suggestion from a trader who uses the app every day. If something about FreeTradeJournal should work differently for how you trade, reply to this email and tell me.
        </Text>
      </Section>
    </EmailShell>
  )
}
