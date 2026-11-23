import { DEMO_STATS, DEMO_TRADES } from '@/data/demo-data'

// Prewritten examples, explicitly labelled; no remote AI request in demo mode.
const money = (value: number) => `${value < 0 ? '-' : '+'}$${Math.abs(value).toFixed(2)}`
function tradeAnalysis(): string {
  return [
    '## Performance Snapshot',
    `**Win rate: ${DEMO_STATS.winRate}%** across ${DEMO_STATS.totalTrades} trades · Net P&L **${money(DEMO_STATS.netProfit)}** after costs`,
    '',
    'Example analysis of the original practice history. This is prewritten, not a live AI review; changes you make in the demo are not included.',
    '',
    '## Key Patterns Detected',
    '- **Costs count** - every example trade includes $0.70 commission, including the trade closed at its entry price.',
    '- **The losses are part of the story** - the journal includes losing trades and reflections on rushed entries.',
    '- **Size stays steady** - each trade uses 0.10 lots, making the results easier to compare.',
    '',
    '## Strengths to Double Down On',
    '- Keep writing down the reason for an entry, even when the result is disappointing.',
    '- Review decisions alongside results; a winning trade can still reveal a habit to change.',
    '',
    '## Critical Improvements',
    '- Add a short reflection to the trades that do not have one yet.',
    '- This short, fictional history cannot establish a reliable trading edge.',
    '',
    '## Action Plan',
    '1. Open a losing trade and read its note.',
    '2. Compare it with a trade where the plan was followed.',
    '3. Pick one process habit to track in your own journal.',
  ].join('\n')
}
function goalCoach(): string {
  return [
    '## Where You Stand',
    'Example coaching for the practice journal. This prewritten response does not update when you edit demo goals.',
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
