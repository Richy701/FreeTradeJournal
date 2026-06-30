// Canned AI responses for demo mode.
//
// In demo mode there is no signed-in backend user, so the real AI endpoints
// (aiStream / aiAssist Cloud Functions) cannot be called. These pre-written
// responses let every AI feature work and look real in the demo without any
// network call or cost. They use the same `## section` / `- bullet` / **bold**
// markdown conventions the live model produces, so the existing renderers format
// them correctly.

function tradeAnalysis(): string {
  return [
    '## Performance Snapshot',
    '**Win rate: 65%** across 34 trades · Avg R:R **2.4:1** · Net P&L **+$3,031**',
    '',
    'Best pair: **GBPJPY** (72% win rate). Strongest window: **London open (8-10am)**. Most of your edge comes from trend continuation, not reversals.',
    '',
    '## Key Patterns Detected',
    '- **Best on trending days** - your win rate jumps to 71% when the daily range is above average',
    '- **Index scalps drag results** - NAS100 intraday trades are -$210 on average versus +$140 on FX swings',
    '- **Sizing creeps up after wins** - position size grows ~35% following two green trades in a row',
    '',
    '## Strengths to Double Down On',
    '- You cut losers fast - average losing trade held well under your winners',
    '- Clear discipline around major levels (round numbers, prior day high/low)',
    '- Morning sessions clearly outperform - you trade better fresh',
    '',
    '## Critical Improvements',
    '- Tighten the index scalping or drop it until the data improves - it is your only negative bucket',
    '- Lock position size to a fixed risk % so good streaks do not inflate your exposure',
    '',
    '## Action Plan',
    '1. Cap risk at a fixed **1% per trade** regardless of recent results',
    '2. Track NAS100 trades separately for two weeks and compare to your FX edge',
    '3. Front-load your trading into the London/NY-open windows where you perform best',
  ].join('\n');
}

function goalCoach(): string {
  return [
    '## Where You Stand',
    'You are **38% to your monthly profit goal** with two-thirds of the month left, which is comfortably on pace. Your win rate goal is already met; the gap is in consistency, not edge.',
    '',
    '## What Is Working',
    '- Steady risk per trade keeps your drawdowns shallow',
    '- You are journaling most trades, which is why these patterns are even visible',
    '',
    '## Focus For The Rest Of The Period',
    '- Protect the progress: one oversized loss is the main threat to the goal right now',
    '- Keep doing the trend-continuation setups that drive most of your green days',
    '',
    '## Suggested Next Goal',
    '1. Add a **max daily loss** limit so a single bad day cannot erase a week',
    '2. Aim for **R:R of 2:1 or better** on new entries to hit target with fewer trades',
  ].join('\n');
}

function tradeReview(): string {
  return [
    '## Trade Review',
    'Solid execution overall. The entry lined up with the prevailing trend and your stop placement gave the trade room to work without risking too much.',
    '',
    '## What Went Well',
    '- Entry in the direction of the higher-timeframe trend',
    '- Risk kept to a sensible fraction of the account',
    '- Exit captured the bulk of the move rather than top-ticking',
    '',
    '## What To Watch',
    '- Consider scaling out partially at your first target to lock in gains',
    '- Note the session and news backdrop so you can repeat the conditions that worked',
    '',
    '## Verdict',
    'A repeatable, **process-driven trade**. Do more of these.',
  ].join('\n');
}

function coachChat(message: string): string {
  const m = (message || '').toLowerCase();

  if (m.includes('win rate') || m.includes('winrate')) {
    return 'Your win rate is sitting around **65%**, which is healthy when paired with your ~2.4:1 average reward-to-risk. With that combination you have real room to be wrong and still grow the account, so do not chase an even higher win rate at the cost of cutting winners early. Focus on keeping your losers small and letting the trend setups run.';
  }
  if (m.includes('best') && (m.includes('pair') || m.includes('symbol') || m.includes('setup'))) {
    return 'Your strongest results come from **GBPJPY and trend-continuation setups during the London open**. Those trades carry a noticeably higher win rate than your index scalps. If you want to grow, lean into what is already working rather than adding new instruments.';
  }
  if (m.includes('improve') || m.includes('better') || m.includes('weak')) {
    return 'The single biggest lever right now is **position sizing discipline** - your size tends to creep up after a couple of wins, which turns an ordinary loss into an outsized one. Lock risk to a fixed percentage per trade. Second, your NAS100 intraday scalps are your only losing bucket, so consider pausing them until the data improves.';
  }
  if (m.includes('risk')) {
    return 'Right now your risk per trade is reasonable, but it is not consistent - it drifts higher after winning streaks. Pick a fixed risk (for example **1% of account per trade**) and keep it there regardless of recent results. Add a max daily loss so one rough session cannot undo a good week.';
  }
  return 'Based on your recent trades, your edge is clearest in **trend-continuation setups during the morning session**, where your win rate and reward-to-risk are both strong. The main thing holding you back is letting position size creep up after wins. Keep risk fixed per trade, lean into the setups that already work, and be selective with index scalps - that is your only consistently negative bucket.';
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
    'You are net positive across your prop accounts after fees. Your funded accounts are carrying the results, and the one failed evaluation is the main drag rather than a pattern.',
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
export const DEMO_AI_TRADE_COUNT = 34;

// The AI-quota figure shown on every demo AI surface. Kept in one place so the
// demo never displays inconsistent "used 1 of N" counts across features.
export const DEMO_AI_USAGE = { used: 1, limit: 10, remaining: 9 };

export function getDemoAIResponse(endpoint: 'analysis' | 'assist', data: any): string {
  if (endpoint === 'analysis') return tradeAnalysis();
  switch (data?.type) {
    case 'goal_coach': return goalCoach();
    case 'trade_review': return tradeReview();
    case 'coach_chat': return coachChat(data?.payload?.message ?? '');
    default: return tradeAnalysis();
  }
}
