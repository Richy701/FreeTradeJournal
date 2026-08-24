import { Section, Text, Heading, Hr, Img } from '@react-email/components'
import { EmailShell, EmailButton, Eyebrow, styles, tone } from './components'
import { BASE_URL } from './facts'

interface TradeIdeasAnnouncementEmailProps {
  firstName?: string
  unsubscribeUrl?: string
}

const screenshot: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  borderRadius: '10px',
  border: `1px solid ${tone.divider}`,
  margin: '0 0 16px',
}

const stepNumber: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '14px',
  backgroundColor: tone.amber,
  color: tone.amberInk,
  fontSize: '13px',
  fontWeight: 800,
  textAlign: 'center',
  lineHeight: '28px',
  margin: 0,
}
const stepTitle: React.CSSProperties = {
  fontSize: '19px',
  fontWeight: 700,
  color: tone.heading,
  margin: 0,
  lineHeight: '1.3',
  letterSpacing: '-0.01em',
}

const rulesBox: React.CSSProperties = {
  backgroundColor: tone.inset,
  border: `1px solid ${tone.insetBorder}`,
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '0 0 4px',
}
const rulesHead: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tone.muted,
  margin: '0 0 10px',
}
const ruleLine: React.CSSProperties = {
  fontSize: '14px',
  color: tone.body,
  lineHeight: '1.6',
  margin: '0 0 4px',
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ margin: '0 0 14px' }}>
      <tbody>
        <tr>
          <td style={{ verticalAlign: 'middle', width: '28px' }}>
            <Text style={stepNumber}>{n}</Text>
          </td>
          <td style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
            <Text style={stepTitle}>{title}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

// Trade Ideas (beta, v2.87.0) announcement. Product news, so it goes to
// everyone including lifetime owners. Split out of the birthday email by
// Richy's call. Screenshots are served from the production site
// (public/screenshots/trade-ideas-*.png, live since 23 Aug 2026).
export function TradeIdeasAnnouncementEmail({ firstName, unsubscribeUrl }: TradeIdeasAnnouncementEmailProps) {
  return (
    <EmailShell
      preview="Post a setup before you take it. Link the trade after. The result shows for everyone."
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={styles.content}>
        <Eyebrow>New, in beta</Eyebrow>
        <Heading style={styles.h1}>
          {firstName ? `${firstName}, Trade Ideas is live.` : 'Trade Ideas is live.'}
        </Heading>
        <Text style={styles.paragraph}>
          A shared feed of setups from other FreeTradeJournal traders. You post a trade before you take it, link the real trade after, and the result shows on the idea for everyone. So the feed does not just show setups, it shows which ones worked.
        </Text>
        <Text style={styles.paragraph}>
          It is free on every plan. There is a new Community section in the sidebar. Here is how it works.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Step n={1} title="Post a setup before you take it" />
        <Img
          src={`${BASE_URL}/screenshots/trade-ideas-post.png`}
          alt="The Post a trade idea form filled in with a short NQ setup showing a planned reward of 2.4R"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          Pick the market and symbol, long or short, then entry, stop and target, and say why. The form works out your planned reward-to-risk as you type and will not let you post a stop on the wrong side of the entry. One chart screenshot can go with it. The first time you post you choose a handle and an avatar. Your real name and email are never shown.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Step n={2} title="Read and like what others post" />
        <Img
          src={`${BASE_URL}/screenshots/trade-ideas-feed.png`}
          alt="The Trade Ideas feed with a long EURUSD setup still open and a short NQ idea marked Worked with its profit"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          The feed shows every open idea with its entry, stop and target, and the reasoning underneath. Like the ones you rate. Anything that breaks the rules can be reported and comes down after three reports.
        </Text>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Step n={3} title="Link the trade, show the result" />
        <Img
          src={`${BASE_URL}/screenshots/trade-ideas-link-trade.png`}
          alt="The Link a trade dialog listing closed EURUSD trades from the Trade Log with a winning one selected"
          width="536"
          style={screenshot}
        />
        <Text style={styles.paragraph}>
          Once you have taken the trade and logged it, open your idea and press Link a trade. Pick it from your Trade Log and the idea shows Worked, Lost or Break even with the P&amp;L. Your record on the page counts it. You cannot type a result in by hand, it has to come from a real logged trade.
        </Text>
        <EmailButton href={`${BASE_URL}/trade-ideas`}>Open Trade Ideas</EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Section style={rulesBox}>
          <Text style={rulesHead}>The rules, in short</Text>
          <Text style={ruleLine}>Your own setups only, and every setup has a stop.</Text>
          <Text style={ruleLine}>No selling, no links, no signals groups.</Text>
          <Text style={ruleLine}>No made-up results. Results come from linked trades only.</Text>
          <Text style={{ ...ruleLine, margin: 0 }}>Up to 5 posts a day.</Text>
        </Section>
      </Section>

      <Hr style={styles.divider} />

      <Section style={styles.content}>
        <Text style={styles.paragraph}>
          It is a beta. If something should work differently for how you trade, use Send feedback on the Trade Ideas page. I read every one.
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: tone.heading, fontWeight: 600 }}>
          Richy, FreeTradeJournal
        </Text>
      </Section>
    </EmailShell>
  )
}
