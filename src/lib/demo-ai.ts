import { DEMO_STATS, DEMO_TRADES } from '@/data/demo-data'
import { isMistakeTag } from '@/lib/tags'

// Prewritten examples, explicitly labelled; no remote AI request in demo mode.
// Figures are worked out from the example trades so the text always matches
// what the dashboard shows.
const money = (value: number) => `${value < 0 ? '-' : '+'}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dollars = (value: number) => `$${Math.round(Math.abs(value)).toLocaleString('en-US')}`
function sumBy<T extends { pnl: number }>(items: T[], key: (item: T) => string): Map<string, { pnl: number; count: number }> {
  const out = new Map<string, { pnl: number; count: number }>()
  for (const item of items) {
    const k = key(item)
    const cur = out.get(k) ?? { pnl: 0, count: 0 }
    cur.pnl += item.pnl
    cur.count++
    out.set(k, cur)
  }
  return out
}
function tradeAnalysis(): string {
  const symbols = [...sumBy(DEMO_TRADES, t => t.symbol)].sort((a, b) => b[1].pnl - a[1].pnl)
  const [bestSym, best] = symbols[0]
  const [worstSym, worst] = symbols[symbols.length - 1]
  const late = DEMO_TRADES.filter(t => t.entryTime.getHours() * 60 + t.entryTime.getMinutes() >= 16 * 60 + 10)
  const lateNet = late.reduce((sum, t) => sum + t.pnl, 0)
  const tagged = DEMO_TRADES.flatMap(t => (t.tags ?? []).filter(tag => isMistakeTag(tag)).map(tag => ({ tag, pnl: t.pnl })))
  const mistakes = sumBy(tagged, m => m.tag)
  const movedStop = mistakes.get('!moved-stop')
  const chased = mistakes.get('!chased')
  const winLossRatio = DEMO_STATS.averageWin / Math.abs(DEMO_STATS.averageLoss)
  return [
    '## Performance Snapshot',
    `**Win rate: ${DEMO_STATS.winRate}%** across ${DEMO_STATS.totalTrades} trades · Net P&L **${money(DEMO_STATS.netProfit)}** after costs`,
    '',
    'Example analysis of the original example history. This is prewritten, not a live AI review; changes you make in the demo are not included.',
    '',
    '## Key Patterns Detected',
    `- **${bestSym} is your best market** - ${money(best.pnl)} from ${best.count} trades, more than everything else combined.`,
    `- **Late trades give money back** - trades opened after 4pm are ${money(lateNet)} overall. Your profit comes from the London and New York opens.`,
    `- **${worstSym} is not paying** - ${money(worst.pnl)} over ${worst.count} trades.`,
    `- **Winners are bigger than losers** - the average win (${dollars(DEMO_STATS.averageWin)}) is ${winLossRatio.toFixed(1)} times the average loss (${dollars(DEMO_STATS.averageLoss)}), so winning about half the time is enough.`,
    '',
    '## Strengths to Double Down On',
    '- Risk stays the same on every trade, so one bad trade never sinks a week.',
    '- You let winning trades reach their target instead of closing them early.',
    '',
    '## Critical Improvements',
    ...(movedStop ? [`- Moving the stop cost ${dollars(movedStop.pnl)} over ${movedStop.count} trades. If you want to move it, close the trade instead.`] : []),
    ...(chased ? [`- Chasing entries cost ${dollars(chased.pnl)} over ${chased.count} trades. Wait for the setup or skip it.`] : []),
    '',
    '## Action Plan',
    '1. Stop trading after 4pm on days that start with a loss.',
    `2. Only take ${worstSym} on your best setups and give that risk to ${bestSym}.`,
    '3. Review every trade tagged moved-stop at the end of the week.',
  ].join('\n')
}
function goalCoach(): string {
  return [
    '## Where You Stand',
    'Example coaching for the example journal. This prewritten response does not update when you edit demo goals.',
    '',
    '## What Is Working',
    '- The example goals sit alongside loss limits so results and boundaries can be reviewed together.',
    '- Short journal notes make the next review easier.',
    '',
    '## Focus For The Rest Of The Period',
    '- Treat a profit goal as a review marker, not a reason to force another trade.',
    '- Choose one habit you can control, such as recording the entry reason.',
    '',
    '## Suggested Next Goal',
    '1. Write a brief reflection after each session.',
    '2. Review those notes at the end of the week.',
  ].join('\n')
}
function tradeReview(): string {
  return [
    '## Trade Review',
    'Illustrative review prompts. This is a prewritten demo example, not an assessment of the selected trade.',
    '',
    '## What Went Well',
    '- Was the entry reason written down before the trade?',
    '- Did the position size and exit follow the plan?',
    '',
    '## What To Watch',
    '- Separate the outcome from the quality of the decision.',
    '- Include costs when reviewing the result.',
    '',
    '## Verdict',
    'Take one specific lesson into the next session. A useful review can be just a few sentences.',
  ].join('\n')
}
function coachChat(message: string): string {
  const intro = 'This is a prewritten demo reply using the original example history, not live coaching. '
  if (/win.?rate/i.test(message)) return intro + `The example has **${DEMO_STATS.winningTrades} winning trades out of ${DEMO_STATS.totalTrades}** (${DEMO_STATS.winRate}%). Read this alongside costs and the size of wins and losses; the percentage alone does not tell the whole story.`
  if (/risk/i.test(message)) return intro + 'Open Goals to explore the example loss limits, then compare a losing trade with its journal note. The useful question is whether the decision followed the plan.'
  return intro + 'Try opening a losing trade and reading its reflection. Then compare it with a trade where the plan was followed. Your own journal can start with one trade, a short entry reason, and one thing to review later.'
}

// NOTE: PropTracker parses this with a specific format - a `SCORE: n/10` line
// followed by sections keyed off exact **bold headings**. Keep the headings
// (The Big Picture / Your Money / Where You Stand / Which Firms Work /
// Watch Out For / Your Game Plan) verbatim or the renderer shows nothing.
export function getDemoPropAnalysis(): string {
  return [
    'SCORE: 7/10',
    '',
    '**The Big Picture**',
    'This is a prewritten example using the demo prop accounts. These fictional accounts are net positive after fees. Your funded accounts are carrying the results, and the one failed evaluation is the main drag rather than a pattern.',
    '',
    '**Your Money**',
    '- Fees and resets spent so far are modest relative to the payouts you have earned',
    '- Your funded FTMO and The5ers accounts have both recovered their costs and are in profit',
    '- Net result across all firms is positive',
    '',
    '**Where You Stand**',
    '- Drawdown usage is low - you are trading well within your limits',
    '- No account is anywhere near a breach, so you have room to keep trading your plan',
    '',
    '**Which Firms Work**',
    '- **FTMO**: funded and profitable - your strongest program',
    '- **The5ers**: instant funding, steady progress',
    '- **Tradeify**: a failed evaluation - the one to learn from before retrying',
    '',
    '**Watch Out For**',
    '- The failed evaluation is your biggest cost sink - avoid rushing into resets after a loss',
    '- You have drawdown room, but do not give it back chasing it; protect the funded accounts',
    '',
    '**Your Game Plan**',
    '1. Concentrate volume on the accounts that are already funded and profitable',
    '2. Only take a new evaluation when your live edge is clearly positive',
    '3. Track cost-to-payout per firm so you know which programs actually pay off',
  ].join('\n');
}

// The demo dataset's headline trade count, kept in sync with DEMO_STATS in
// demo-data.ts. Exposed here so demo AI surfaces can show a consistent count
// without importing the (large) demo dataset module.
export const DEMO_AI_TRADE_COUNT = DEMO_TRADES.length;

// The AI-quota figure shown on every demo AI surface. Kept in one place so the
// demo never displays inconsistent "used 1 of N" counts across features.
export const DEMO_AI_USAGE = { used: 1, limit: 10, remaining: 9 };

export function getDemoAIResponse(endpoint: 'analysis' | 'assist', data: { type?: string; payload?: { message?: string } } | null): string {
  if (endpoint === 'analysis') return tradeAnalysis();
  switch (data?.type) {
    case 'goal_coach': return goalCoach();
    case 'trade_review': return tradeReview();
    case 'coach_chat': return coachChat(data?.payload?.message ?? '');
    default: return tradeAnalysis();
  }
}
