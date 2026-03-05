import { format } from 'date-fns';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  entryTime: Date;
  exitTime: Date;
  spread: number;
  commission: number;
  swap: number;
  pnl: number;
  riskReward?: number;
  strategy?: string;
  notes?: string;
  market?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  tags?: string[];
}

export interface PDFReportOptions {
  trades: Trade[];
  journalEntries?: JournalEntry[];
  period: { start: Date; end: Date };
  reportType: string;
  accountName?: string;
}

type RGB = [number, number, number];

// ─── Personality Archetypes ─────────────────────────────────
function getTraderPersonality(stats: ReturnType<typeof analyze>) {
  const { winRate, totalTrades, avgHoldMinutes, profitFactor, topSymbolPct } = stats;

  if (winRate >= 70 && totalTrades < 30)
    return { name: 'The Sniper', desc: 'Few trades. Deadly accuracy. You don\'t spray — you aim.' };
  if (totalTrades >= 100 && winRate >= 50)
    return { name: 'The Machine', desc: 'Consistent. Relentless. You show up, execute, repeat.' };
  if (profitFactor >= 2.5)
    return { name: 'The Whale', desc: 'Your winners dwarf your losers. When you\'re right, you\'re really right.' };
  if (avgHoldMinutes < 15 && totalTrades >= 30)
    return { name: 'The Scalper', desc: 'In and out before anyone blinks. Speed is your edge.' };
  if (topSymbolPct >= 60)
    return { name: 'The Specialist', desc: 'One instrument. Deep mastery. You know it better than anyone.' };
  if (avgHoldMinutes > 1440)
    return { name: 'The Strategist', desc: 'Patient. Calculated. You let trades come to you.' };
  if (winRate < 40 && profitFactor >= 1.5)
    return { name: 'The Risk Taker', desc: 'You lose more than you win — but your wins more than cover it.' };
  if (totalTrades >= 50 && winRate >= 45)
    return { name: 'The Grinder', desc: 'Reps on reps. Every session is another step forward.' };
  return { name: 'The Explorer', desc: 'Still finding your style. Every great trader started here.' };
}

// ─── Analysis Engine ────────────────────────────────────────
function analyze(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime());
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : wins.length > 0 ? Infinity : 0;
  const largestWin = wins.length > 0 ? wins.reduce((best, t) => t.pnl > best.pnl ? t : best, wins[0]) : null;
  const largestLoss = losses.length > 0 ? losses.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, losses[0]) : null;

  const symbolMap = new Map<string, { count: number; pnl: number; wins: number }>();
  trades.forEach(t => {
    const s = symbolMap.get(t.symbol) || { count: 0, pnl: 0, wins: 0 };
    symbolMap.set(t.symbol, { count: s.count + 1, pnl: s.pnl + t.pnl, wins: s.wins + (t.pnl > 0 ? 1 : 0) });
  });
  const symbolArr = Array.from(symbolMap.entries()).sort((a, b) => b[1].count - a[1].count);
  const topSymbol = symbolArr[0] ? { name: symbolArr[0][0], ...symbolArr[0][1] } : null;
  const topSymbolPct = topSymbol && totalTrades > 0 ? (topSymbol.count / totalTrades) * 100 : 0;
  const worstSymbol = symbolArr.length > 1
    ? Array.from(symbolMap.entries()).sort((a, b) => a[1].pnl - b[1].pnl)[0]
    : null;

  const dayMap = new Map<string, { count: number; pnl: number; wins: number }>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  trades.forEach(t => {
    const day = dayNames[new Date(t.exitTime).getDay()];
    const d = dayMap.get(day) || { count: 0, pnl: 0, wins: 0 };
    dayMap.set(day, { count: d.count + 1, pnl: d.pnl + t.pnl, wins: d.wins + (t.pnl > 0 ? 1 : 0) });
  });
  const bestDay = Array.from(dayMap.entries()).sort((a, b) => b[1].pnl - a[1].pnl)[0] || null;
  const dayStats = Array.from(dayMap.entries());

  const hourMap = new Map<number, { count: number; pnl: number }>();
  trades.forEach(t => {
    const h = new Date(t.entryTime).getHours();
    const d = hourMap.get(h) || { count: 0, pnl: 0 };
    hourMap.set(h, { count: d.count + 1, pnl: d.pnl + t.pnl });
  });
  const bestHour = Array.from(hourMap.entries()).sort((a, b) => b[1].pnl - a[1].pnl)[0] || null;

  const longs = trades.filter(t => t.side === 'long');
  const shorts = trades.filter(t => t.side === 'short');
  const longPnL = longs.reduce((s, t) => s + t.pnl, 0);
  const shortPnL = shorts.reduce((s, t) => s + t.pnl, 0);
  const longWinRate = longs.length > 0 ? (longs.filter(t => t.pnl > 0).length / longs.length) * 100 : 0;
  const shortWinRate = shorts.length > 0 ? (shorts.filter(t => t.pnl > 0).length / shorts.length) * 100 : 0;

  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
  sorted.forEach(t => {
    if (t.pnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
    else if (t.pnl < 0) { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
    else { curWin = 0; curLoss = 0; }
  });

  const holdTimes = trades.map(t => (new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000);
  const avgHoldMinutes = holdTimes.length > 0 ? holdTimes.reduce((s, m) => s + m, 0) / holdTimes.length : 0;

  const stratMap = new Map<string, { count: number; pnl: number }>();
  trades.forEach(t => {
    if (!t.strategy) return;
    const s = stratMap.get(t.strategy) || { count: 0, pnl: 0 };
    stratMap.set(t.strategy, { count: s.count + 1, pnl: s.pnl + t.pnl });
  });
  const topStrategy = Array.from(stratMap.entries()).sort((a, b) => b[1].pnl - a[1].pnl)[0] || null;

  let cum = 0;
  const equityPoints = sorted.map(t => { cum += t.pnl; return cum; });
  const tradingDays = new Set(trades.map(t => format(new Date(t.exitTime), 'yyyy-MM-dd'))).size;

  return {
    sorted, totalTrades, wins: wins.length, losses: losses.length, winRate,
    totalPnL, avgWin, avgLoss, profitFactor,
    largestWin, largestLoss,
    topSymbol, topSymbolPct, worstSymbol,
    bestDay, bestHour, dayStats,
    longs: longs.length, shorts: shorts.length, longPnL, shortPnL, longWinRate, shortWinRate,
    maxWinStreak, maxLossStreak,
    avgHoldMinutes, topStrategy,
    equityPoints, tradingDays,
  };
}

function fmtCurrency(v: number): string {
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtHoldTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12} ${ampm}`;
}

// ─── Logo ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawLogo(doc: any, x: number, y: number, size: number) {
  const r = size * 0.19;
  doc.setFillColor(255, 192, 0);
  doc.roundedRect(x, y, size, size, r, r, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size * 0.36);
  doc.setTextColor(0, 0, 0);
  doc.text('FTJ', x + size / 2, y + size * 0.62, { align: 'center' });
}

// ─── Visual Helpers ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gradientBg(doc: any, c1: RGB, c2: RGB, W: number, H: number) {
  const steps = 50;
  const stepH = H / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    doc.setFillColor(
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t),
    );
    doc.rect(0, i * stepH, W, stepH + 0.3, 'F');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDonutSegment(doc: any, cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number, color: RGB) {
  const steps = 48;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    pts.push([cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)]);
  }
  for (let i = steps; i >= 0; i--) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    pts.push([cx + innerR * Math.cos(a), cy + innerR * Math.sin(a)]);
  }
  doc.setFillColor(color[0], color[1], color[2]);
  const moves: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    moves.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  doc.lines(moves, pts[0][0], pts[0][1], [1, 1], 'F', true);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawDonut(doc: any, cx: number, cy: number, outerR: number, innerR: number, segments: { pct: number; color: RGB }[]) {
  let currentAngle = -Math.PI / 2;
  for (const seg of segments) {
    if (seg.pct <= 0) continue;
    const sweep = (seg.pct / 100) * 2 * Math.PI;
    drawDonutSegment(doc, cx, cy, outerR, innerR, currentAngle, currentAngle + sweep, seg.color);
    currentAngle += sweep;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawProgressBar(doc: any, x: number, y: number, w: number, h: number, pct: number, bgColor: RGB, fillColor: RGB) {
  const r = h / 2;
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(x, y, w, h, r, r, 'F');
  const fillW = Math.max(h, w * (Math.min(pct, 100) / 100));
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.roundedRect(x, y, fillW, h, r, r, 'F');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawWatermark(doc: any, text: string, x: number, y: number, size: number, opacity = 0.04) {
  const setOp = (o: number) => doc.setGState(new (doc.GState as any)({ opacity: o }));
  setOp(opacity);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(255, 255, 255);
  doc.text(text, x, y);
  setOp(1);
}

// ─── PDF Generator ──────────────────────────────────────────
export async function generatePDFReport(options: PDFReportOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 24; // left margin
  const R = W - 24; // right edge

  const { trades, period } = options;
  const stats = analyze(trades);
  const persona = getTraderPersonality(stats);
  const periodLabel = `${format(period.start, 'MMM d')} – ${format(period.end, 'MMM d, yyyy')}`;

  // ─── Helpers ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setOpacity = (o: number) => doc.setGState(new (doc.GState as any)({ opacity: o }));
  const tc = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const fc = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);

  const footer = () => {
    doc.setFontSize(7);
    tc([60, 60, 65]);
    doc.setFont('helvetica', 'normal');
    doc.text('FreeTradeJournal', L, H - 10);
  };

  // Shared colors
  const green: RGB = [52, 211, 153];
  const red: RGB = [248, 113, 113];
  const amber: RGB = [251, 191, 36];
  const white: RGB = [255, 255, 255];
  const dim: RGB = [120, 120, 130];
  const dimmer: RGB = [70, 70, 75];
  const barBg: RGB = [25, 25, 30];

  // ═══════════════════════════════════════════════════════════
  // ─── 1. Cover ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  gradientBg(doc, [8, 8, 10], [14, 12, 18], W, H);

  // Logo + brand
  drawLogo(doc, L, 32, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  tc(white);
  doc.text('FreeTradeJournal', L + 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  tc(dim);
  doc.text('Your personalised trading recap', L + 18, 49);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(64);
  tc(white);
  doc.text('Your', L, 110);
  doc.text('Trading', L, 134);
  tc(amber);
  doc.text('Wrapped.', L, 158);

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc(dim);
  doc.text(periodLabel, L, 180);

  if (options.accountName) {
    doc.setFontSize(14);
    tc(dimmer);
    doc.text(options.accountName, L, 194);
  }

  // Bottom stat pills
  const statY = H - 45;
  const pillGap = 50;
  const pillData = [
    { label: 'TRADES', value: String(stats.totalTrades) },
    { label: 'DAYS', value: String(stats.tradingDays) },
    { label: 'AVG HOLD', value: fmtHoldTime(stats.avgHoldMinutes) },
  ];
  pillData.forEach((p, i) => {
    const px = L + i * pillGap;
    fc([25, 25, 30]);
    doc.roundedRect(px, statY, 42, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    tc(white);
    doc.text(p.value, px + 21, statY + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    tc(dimmer);
    doc.text(p.label, px + 21, statY + 17, { align: 'center' });
  });

  footer();

  // ═══════════════════════════════════════════════════════════
  // ─── 2. The Numbers ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  doc.addPage();
  const numGrad2: RGB = stats.totalPnL >= 0 ? [10, 16, 12] : [16, 10, 10];
  gradientBg(doc, [8, 8, 10], numGrad2, W, H);

  // Watermark — giant faded P&L
  drawWatermark(doc, fmtCurrency(Math.abs(stats.totalPnL)), W * 0.12, H * 0.38, 80, 0.03);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc(dim);
  doc.text(stats.totalPnL >= 0 ? 'This period, you made' : 'This period, you lost', L, 50);

  // Giant P&L number
  const pnlColor: RGB = stats.totalPnL >= 0 ? green : red;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(72);
  tc(pnlColor);
  doc.text(fmtCurrency(Math.abs(stats.totalPnL)), L, 88);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc(dim);
  doc.text(`across ${stats.totalTrades} trades`, L, 106);

  // Divider
  fc(dimmer);
  doc.rect(L, 118, 40, 0.5, 'F');

  // Win rate row with progress bar
  let y = 134;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  tc(dimmer);
  doc.text('Win rate', L, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  tc(amber);
  doc.text(`${stats.winRate.toFixed(1)}%`, L, y + 11);
  drawProgressBar(doc, L + 50, y + 3, 50, 5, stats.winRate, barBg, amber);

  // Profit factor row with progress bar
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  tc(dimmer);
  doc.text('Profit factor', L, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  tc(amber);
  doc.text(stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), L, y + 11);
  const pfPct = stats.profitFactor === Infinity ? 100 : Math.min((stats.profitFactor / 3) * 100, 100);
  drawProgressBar(doc, L + 50, y + 3, 50, 5, pfPct, barBg, amber);

  // Best/worst trade
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  tc(dimmer);
  doc.text('Best trade', L, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  tc(green);
  doc.text(stats.largestWin ? `${fmtCurrency(stats.largestWin.pnl)}  on ${stats.largestWin.symbol}` : '—', L, y + 10);

  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  tc(dimmer);
  doc.text('Worst trade', L, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  tc(red);
  doc.text(stats.largestLoss ? `${fmtCurrency(stats.largestLoss.pnl)}  on ${stats.largestLoss.symbol}` : '—', L, y + 10);

  // ── Donut chart for win/loss ──
  const donutCx = R - 30;
  const donutCy = 160;
  const donutOuter = 28;
  const donutInner = 17;

  drawDonut(doc, donutCx, donutCy, donutOuter, donutInner, [
    { pct: stats.winRate, color: green },
    { pct: 100 - stats.winRate, color: red },
  ]);

  // Win rate in center
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  tc(white);
  doc.text(`${stats.winRate.toFixed(0)}%`, donutCx, donutCy + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  tc(dim);
  doc.text('WIN RATE', donutCx, donutCy + 10, { align: 'center' });

  // Win/Loss labels below donut
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  tc(green);
  doc.text(String(stats.wins), donutCx - 14, donutCy + donutOuter + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('W', donutCx - 14, donutCy + donutOuter + 20, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  tc(red);
  doc.text(String(stats.losses), donutCx + 14, donutCy + donutOuter + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('L', donutCx + 14, donutCy + donutOuter + 20, { align: 'center' });

  footer();

  // ═══════════════════════════════════════════════════════════
  // ─── 3. Top Instrument ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (stats.topSymbol) {
    doc.addPage();
    gradientBg(doc, [4, 12, 10], [8, 22, 18], W, H);

    const tealDim: RGB = [80, 150, 125];

    // Watermark — giant faded symbol
    drawWatermark(doc, stats.topSymbol.name, W * 0.15, H * 0.42, 100, 0.03);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(tealDim);
    doc.text('Your go-to instrument', L, 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(68);
    tc(white);
    doc.text(stats.topSymbol.name, L, 95);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    tc(tealDim);
    doc.text(`${stats.topSymbol.count} trades  ·  ${stats.topSymbolPct.toFixed(0)}% of all your activity`, L, 115);

    // Divider
    fc(tealDim);
    doc.rect(L, 128, 40, 0.5, 'F');

    // P&L stat with card
    const topWinRate = (stats.topSymbol.wins / stats.topSymbol.count * 100);

    fc([10, 28, 22]);
    doc.roundedRect(L, 140, (R - L - 8) / 2, 52, 4, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    tc([60, 110, 90]);
    doc.text('P&L', L + 10, 153);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    tc(stats.topSymbol.pnl >= 0 ? green : red);
    doc.text(fmtCurrency(stats.topSymbol.pnl), L + 10, 177);

    // Win rate stat card with progress bar
    const cardX2 = L + (R - L - 8) / 2 + 8;
    fc([10, 28, 22]);
    doc.roundedRect(cardX2, 140, (R - L - 8) / 2, 52, 4, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    tc([60, 110, 90]);
    doc.text('Win rate', cardX2 + 10, 153);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    tc(green);
    doc.text(`${topWinRate.toFixed(0)}%`, cardX2 + 10, 177);
    drawProgressBar(doc, cardX2 + 10, 182, (R - L - 8) / 2 - 20, 4, topWinRate, [15, 35, 28], green);

    // Worst symbol callout
    if (stats.worstSymbol && stats.worstSymbol[1].pnl < 0) {
      fc([15, 30, 25]);
      doc.roundedRect(L, 210, R - L, 28, 4, 4, 'F');
      // Red accent left border
      fc(red);
      doc.roundedRect(L, 210, 3, 28, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      tc(tealDim);
      doc.text(`${stats.worstSymbol[0]} cost you ${fmtCurrency(Math.abs(stats.worstSymbol[1].pnl))}. Consider cutting it.`, L + 12, 227);
    }

    footer();
  }

  // ═══════════════════════════════════════════════════════════
  // ─── 4. Your Money Day + Hour ────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (stats.bestDay) {
    doc.addPage();
    gradientBg(doc, [14, 10, 4], [22, 16, 6], W, H);

    const warmDim: RGB = [150, 120, 75];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(warmDim);
    doc.text('You trade best on', L, 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(64);
    tc(amber);
    doc.text(`${stats.bestDay[0]}s`, L, 95);

    const dayWinRate = stats.bestDay[1].count > 0 ? (stats.bestDay[1].wins / stats.bestDay[1].count * 100).toFixed(0) : '0';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    tc(warmDim);
    doc.text(`${fmtCurrency(stats.bestDay[1].pnl)} profit  ·  ${dayWinRate}% win rate  ·  ${stats.bestDay[1].count} trades`, L, 115);

    // Divider
    fc(warmDim);
    doc.rect(L, 126, 40, 0.5, 'F');

    // ── Day-of-week bar chart ──
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
    const dayEntries = dayOrder
      .map(d => ({ day: d, data: stats.dayStats.find(([name]) => name === d)?.[1] }))
      .filter(d => d.data && d.data.count > 0);

    if (dayEntries.length > 0) {
      const maxAbsPnl = Math.max(...dayEntries.map(d => Math.abs(d.data!.pnl)), 1);
      const barChartY = 138;
      const rowH = 11;
      const barMaxW = 75;
      const barStartX = L + 22;

      dayEntries.forEach((d, i) => {
        const rowY = barChartY + i * rowH;
        const pnl = d.data!.pnl;
        const barW = Math.max(2, (Math.abs(pnl) / maxAbsPnl) * barMaxW);
        const isPos = pnl >= 0;
        const isBest = d.day === stats.bestDay![0];

        // Day label
        doc.setFont('helvetica', isBest ? 'bold' : 'normal');
        doc.setFontSize(9);
        tc(isBest ? amber : warmDim);
        doc.text(shortDays[d.day] || d.day, L, rowY + 6);

        // Bar
        fc(isPos ? green : red);
        setOpacity(isBest ? 0.7 : 0.35);
        doc.roundedRect(barStartX, rowY + 1, barW, 6, 2, 2, 'F');
        setOpacity(1);

        // Value
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        tc(isPos ? green : red);
        doc.text(fmtCurrency(pnl), barStartX + barW + 4, rowY + 6);
      });
    }

    // Divider
    const barChartEndY = 138 + (dayEntries.length * 11) + 8;
    fc(warmDim);
    doc.rect(L, barChartEndY, 40, 0.5, 'F');

    // Peak hour
    if (stats.bestHour) {
      const hourY = barChartEndY + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      tc(warmDim);
      doc.text('Your peak trading hour', L, hourY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(56);
      tc(white);
      doc.text(formatHour(stats.bestHour[0]), L, hourY + 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(15);
      tc(warmDim);
      doc.text(`${fmtCurrency(stats.bestHour[1].pnl)} from ${stats.bestHour[1].count} trades at this hour`, L, hourY + 56);
    }

    footer();
  }

  // ═══════════════════════════════════════════════════════════
  // ─── 5. Long vs Short ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (stats.longs > 0 || stats.shorts > 0) {
    doc.addPage();
    gradientBg(doc, [6, 6, 14], [10, 10, 24], W, H);

    const coolDim: RGB = [100, 100, 150];
    const totalDir = stats.longs + stats.shorts;
    const longPct = totalDir > 0 ? (stats.longs / totalDir) * 100 : 50;
    const betterSide = stats.longPnL >= stats.shortPnL ? 'long' : 'short';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(coolDim);
    doc.text(`You lean ${longPct > 55 ? 'long' : longPct < 45 ? 'short' : 'balanced'}`, L, 50);

    // ── Stacked bar showing long/short split ──
    const stackY = 60;
    const stackH = 10;
    const stackW = R - L;
    const longBarW = stackW * (longPct / 100);

    fc(green);
    setOpacity(0.6);
    doc.roundedRect(L, stackY, longBarW, stackH, stackH / 2, stackH / 2, 'F');
    setOpacity(1);
    fc(red);
    setOpacity(0.6);
    // Right portion - overlap rounding handled by drawing full bar behind
    doc.roundedRect(L + longBarW, stackY, stackW - longBarW, stackH, stackH / 2, stackH / 2, 'F');
    setOpacity(1);

    // Labels on bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (longPct > 15) {
      tc(white);
      doc.text(`${longPct.toFixed(0)}% LONG`, L + longBarW / 2, stackY + 6.5, { align: 'center' });
    }
    if (longPct < 85) {
      tc(white);
      doc.text(`${(100 - longPct).toFixed(0)}% SHORT`, L + longBarW + (stackW - longBarW) / 2, stackY + 6.5, { align: 'center' });
    }

    // ── Side-by-side stat cards ──
    const cardGap = 8;
    const cardWidth = (R - L - cardGap) / 2;
    const cardTop = 82;
    const cardHeight = 90;

    // Long card
    fc([14, 22, 18]);
    doc.roundedRect(L, cardTop, cardWidth, cardHeight, 6, 6, 'F');
    // Green accent top border
    fc(green);
    doc.roundedRect(L, cardTop, cardWidth, 3, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(44);
    tc(green);
    doc.text(`${stats.longs}`, L + cardWidth / 2, cardTop + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    tc(coolDim);
    doc.text('long trades', L + cardWidth / 2, cardTop + 44, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    tc(stats.longPnL >= 0 ? green : red);
    doc.text(fmtCurrency(stats.longPnL), L + cardWidth / 2, cardTop + 62, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    tc(coolDim);
    doc.text(`${stats.longWinRate.toFixed(0)}% win rate`, L + cardWidth / 2, cardTop + 74, { align: 'center' });

    // Progress bar inside long card
    drawProgressBar(doc, L + 12, cardTop + 78, cardWidth - 24, 4, stats.longWinRate, [20, 30, 25], green);

    // Short card
    const shortCardX = L + cardWidth + cardGap;
    fc([18, 14, 22]);
    doc.roundedRect(shortCardX, cardTop, cardWidth, cardHeight, 6, 6, 'F');
    // Red accent top border
    fc(red);
    doc.roundedRect(shortCardX, cardTop, cardWidth, 3, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(44);
    tc(red);
    doc.text(`${stats.shorts}`, shortCardX + cardWidth / 2, cardTop + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    tc(coolDim);
    doc.text('short trades', shortCardX + cardWidth / 2, cardTop + 44, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    tc(stats.shortPnL >= 0 ? green : red);
    doc.text(fmtCurrency(stats.shortPnL), shortCardX + cardWidth / 2, cardTop + 62, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    tc(coolDim);
    doc.text(`${stats.shortWinRate.toFixed(0)}% win rate`, shortCardX + cardWidth / 2, cardTop + 74, { align: 'center' });

    drawProgressBar(doc, shortCardX + 12, cardTop + 78, cardWidth - 24, 4, stats.shortWinRate, [25, 20, 30], red);

    // Verdict pill
    fc([20, 20, 35]);
    doc.roundedRect(L, cardTop + cardHeight + 12, R - L, 22, 4, 4, 'F');
    // Accent left border
    fc(betterSide === 'long' ? green : red);
    doc.roundedRect(L, cardTop + cardHeight + 12, 3, 22, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    tc(white);
    doc.text(`Your ${betterSide} trades are more profitable.`, L + 12, cardTop + cardHeight + 26);

    footer();
  }

  // ═══════════════════════════════════════════════════════════
  // ─── 6. Streaks + Strategy ───────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (stats.maxWinStreak > 0 || stats.maxLossStreak > 0) {
    doc.addPage();
    gradientBg(doc, [12, 6, 10], [20, 10, 18], W, H);

    const pinkDim: RGB = [140, 90, 120];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(pinkDim);
    doc.text('Your longest winning streak', L, 50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(96);
    tc(green);
    doc.text(String(stats.maxWinStreak), L, 110);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(pinkDim);
    doc.text('consecutive wins in a row', L, 125);

    // ── Streak dot visualization ──
    // Show last N trades as green/red dots
    const lastN = Math.min(stats.sorted.length, 30);
    const recentTrades = stats.sorted.slice(-lastN);
    const dotR = 3;
    const dotGap = 2;
    const dotsPerRow = Math.min(lastN, 15);
    const dotStartX = L;
    const dotStartY = 135;

    recentTrades.forEach((t, i) => {
      const row = Math.floor(i / dotsPerRow);
      const col = i % dotsPerRow;
      const dx = dotStartX + col * (dotR * 2 + dotGap);
      const dy = dotStartY + row * (dotR * 2 + dotGap);
      fc(t.pnl > 0 ? green : t.pnl < 0 ? red : dim);
      setOpacity(0.7);
      doc.circle(dx + dotR, dy + dotR, dotR, 'F');
      setOpacity(1);
    });

    // Label
    const dotEndY = dotStartY + (Math.ceil(lastN / dotsPerRow)) * (dotR * 2 + dotGap) + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    tc(pinkDim);
    doc.text(`Last ${lastN} trades`, dotStartX, dotEndY + 4);

    // Divider
    fc(pinkDim);
    doc.rect(L, dotEndY + 12, 40, 0.5, 'F');

    // Loss streak
    const lossY = dotEndY + 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    tc(pinkDim);
    doc.text('Longest loss streak', L, lossY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    tc(red);
    doc.text(String(stats.maxLossStreak), L, lossY + 30);

    // Strategy
    if (stats.topStrategy) {
      const stratY = lossY + 46;
      fc(pinkDim);
      doc.rect(L, stratY, 40, 0.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      tc(pinkDim);
      doc.text('Most profitable strategy', L, stratY + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(34);
      tc(white);
      doc.text(stats.topStrategy[0], L, stratY + 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      tc(pinkDim);
      doc.text(`${fmtCurrency(stats.topStrategy[1].pnl)} from ${stats.topStrategy[1].count} trades`, L, stratY + 56);
    }

    footer();
  }

  // ═══════════════════════════════════════════════════════════
  // ─── 7. Equity Curve ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (stats.equityPoints.length > 1) {
    doc.addPage();
    gradientBg(doc, [4, 8, 6], [8, 16, 12], W, H);

    const eqDim: RGB = [80, 120, 100];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    tc(eqDim);
    doc.text('Your equity journey', L, 40);

    const pts = stats.equityPoints;
    const chartX = L + 8;
    const chartW = R - L - 8;
    const chartTop = 55;
    const chartH = 160;

    const maxV = Math.max(...pts, 0);
    const minV = Math.min(...pts, 0);
    const range = maxV - minV || 1;

    // Subtle grid
    doc.setDrawColor(20, 40, 30);
    doc.setLineWidth(0.15);
    for (let i = 0; i <= 4; i++) {
      const gy = chartTop + (chartH * i) / 4;
      doc.line(chartX, gy, chartX + chartW, gy);
    }

    // Zero line
    const zeroY = chartTop + ((maxV - 0) / range) * chartH;
    doc.setDrawColor(45, 75, 55);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(chartX, zeroY, chartX + chartW, zeroY);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(9);
    tc(eqDim);
    doc.text('$0', chartX - 3, zeroY + 1, { align: 'right' });

    // ── Filled area under curve ──
    const stepX = chartW / (pts.length - 1);
    const areaColor: RGB = pts[pts.length - 1] >= 0 ? green : red;
    setOpacity(0.1);
    fc(areaColor);

    const startPtX = chartX;
    const startPtY = chartTop + ((maxV - pts[0]) / range) * chartH;
    const areaMoves: [number, number][] = [];

    for (let i = 1; i < pts.length; i++) {
      const prevX = chartX + (i - 1) * stepX;
      const prevY = chartTop + ((maxV - pts[i - 1]) / range) * chartH;
      const curX = chartX + i * stepX;
      const curY = chartTop + ((maxV - pts[i]) / range) * chartH;
      areaMoves.push([curX - prevX, curY - prevY]);
    }

    // Close polygon along zero line
    const lastCurveY = chartTop + ((maxV - pts[pts.length - 1]) / range) * chartH;
    areaMoves.push([0, zeroY - lastCurveY]); // down to zero
    areaMoves.push([startPtX - (chartX + (pts.length - 1) * stepX), 0]); // left along zero

    doc.lines(areaMoves, startPtX, startPtY, [1, 1], 'F', true);
    setOpacity(1);

    // ── Equity line (on top of fill) ──
    doc.setLineWidth(0.9);
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = chartX + i * stepX;
      const x2 = chartX + (i + 1) * stepX;
      const y1 = chartTop + ((maxV - pts[i]) / range) * chartH;
      const y2 = chartTop + ((maxV - pts[i + 1]) / range) * chartH;
      const c: RGB = pts[i + 1] >= 0 ? green : red;
      doc.setDrawColor(c[0], c[1], c[2]);
      doc.line(x1, y1, x2, y2);
    }

    // End dot
    const lastX = chartX + (pts.length - 1) * stepX;
    const endColor: RGB = pts[pts.length - 1] >= 0 ? green : red;
    fc(endColor);
    doc.circle(lastX, lastCurveY, 1.8, 'F');

    // Axis labels
    doc.setFontSize(10);
    tc(eqDim);
    doc.text(fmtCurrency(maxV), chartX - 3, chartTop + 3, { align: 'right' });
    doc.text(fmtCurrency(minV), chartX - 3, chartTop + chartH + 2, { align: 'right' });

    // Dates
    doc.text(format(new Date(stats.sorted[0].exitTime), 'MMM d'), chartX, chartTop + chartH + 12);
    doc.text(format(new Date(stats.sorted[stats.sorted.length - 1].exitTime), 'MMM d'), chartX + chartW, chartTop + chartH + 12, { align: 'right' });

    // Final callout — larger, in a card
    const finalPnl = pts[pts.length - 1];
    const calloutY = chartTop + chartH + 22;
    fc([12, 24, 18]);
    doc.roundedRect(L, calloutY, R - L, 28, 4, 4, 'F');
    fc(endColor);
    doc.roundedRect(L, calloutY, 3, 28, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    tc(endColor);
    doc.text(
      finalPnl >= 0 ? `Finished up ${fmtCurrency(finalPnl)}` : `Finished down ${fmtCurrency(Math.abs(finalPnl))}`,
      L + 12, calloutY + 18,
    );

    footer();
  }

  // ═══════════════════════════════════════════════════════════
  // ─── 8. Trader Personality ───────────────────────────────
  // ═══════════════════════════════════════════════════════════
  doc.addPage();
  gradientBg(doc, [6, 6, 6], [12, 12, 16], W, H);

  // Big faded persona name watermark
  drawWatermark(doc, persona.name.replace('The ', ''), W * 0.05, H * 0.55, 90, 0.025);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc(dimmer);
  doc.text('Your trader type', L, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  tc(amber);
  doc.text(persona.name, L, 100);

  // Decorative accent bar
  fc(amber);
  doc.rect(L, 110, 50, 2.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  tc([190, 190, 195]);
  const descLines = doc.splitTextToSize(persona.desc, R - L);
  doc.text(descLines, L, 132);

  // Trait cards — 2x2 grid with accent borders
  const traitStartY = 180;
  const traits = [
    { label: 'AVG HOLD', value: fmtHoldTime(stats.avgHoldMinutes), color: amber },
    { label: 'TRADES / DAY', value: stats.tradingDays > 0 ? (stats.totalTrades / stats.tradingDays).toFixed(1) : '0', color: green },
    { label: 'WIN RATE', value: `${stats.winRate.toFixed(0)}%`, color: amber },
    { label: 'PROFIT FACTOR', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), color: green },
  ];

  const cardW = (R - L - 10) / 2;
  traits.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = L + col * (cardW + 10);
    const cy = traitStartY + row * 44;

    fc([20, 20, 22]);
    doc.roundedRect(cx, cy, cardW, 38, 5, 5, 'F');
    // Colored accent top border
    fc(t.color);
    doc.roundedRect(cx, cy, cardW, 2.5, 2.5, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    tc(white);
    doc.text(t.value, cx + 12, cy + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    tc(dimmer);
    doc.text(t.label, cx + 12, cy + 30);
  });

  footer();

  // ═══════════════════════════════════════════════════════════
  // ─── 9. Key Takeaway + Fun Facts ─────────────────────────
  // ═══════════════════════════════════════════════════════════
  doc.addPage();
  gradientBg(doc, [4, 4, 10], [10, 8, 20], W, H);

  let takeawayTitle = '';
  let takeawayBody = '';

  if (stats.totalPnL >= 0 && stats.winRate >= 55) {
    takeawayTitle = 'Keep going.';
    takeawayBody = 'You\'re profitable with a real edge. Don\'t overthink it. Focus on consistency and let the numbers compound.';
  } else if (stats.totalPnL >= 0 && stats.winRate < 55) {
    takeawayTitle = 'Your winners carry you.';
    takeawayBody = 'You win less than half the time, but your wins are big enough. Don\'t start cutting winners short — that\'s your edge.';
  } else if (stats.maxLossStreak >= 5) {
    takeawayTitle = 'Survive the drawdowns.';
    takeawayBody = `A ${stats.maxLossStreak}-trade losing streak is brutal. Consider reducing size after 3 consecutive losses. Protect your capital and your head.`;
  } else if (stats.totalPnL < 0 && stats.worstSymbol) {
    takeawayTitle = 'Cut what\'s bleeding.';
    takeawayBody = `${stats.worstSymbol[0]} cost you ${fmtCurrency(Math.abs(stats.worstSymbol[1].pnl))}. Removing one bad instrument could change everything.`;
  } else {
    takeawayTitle = 'Every trade teaches.';
    takeawayBody = `${stats.totalTrades} trades this period. Review your best and worst. The patterns are there — you just have to look.`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc(dimmer);
  doc.text('One thing to remember', L, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  tc(white);
  const titleLines = doc.splitTextToSize(takeawayTitle, R - L);
  doc.text(titleLines, L, 95);

  const titleHeight = titleLines.length * 18;

  fc(amber);
  doc.rect(L, 95 + titleHeight + 4, 50, 2.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  tc([160, 160, 170]);
  const bodyLines = doc.splitTextToSize(takeawayBody, R - L - 10);
  doc.text(bodyLines, L, 95 + titleHeight + 22);

  const bodyEndY = 95 + titleHeight + 22 + bodyLines.length * 7;

  // ── Fun Facts ──
  const totalMarketHours = (stats.avgHoldMinutes * stats.totalTrades) / 60;
  const tradesPerDay = stats.tradingDays > 0 ? (stats.totalTrades / stats.tradingDays) : 0;
  const lossesPerBestTrade = stats.largestWin && stats.avgLoss > 0
    ? Math.floor(stats.largestWin.pnl / stats.avgLoss) : 0;

  const funFacts: string[] = [];
  if (totalMarketHours >= 1) {
    funFacts.push(`You spent roughly ${totalMarketHours.toFixed(0)} hours in the market this period.`);
  }
  if (tradesPerDay > 0) {
    funFacts.push(`On days you traded, you averaged ${tradesPerDay.toFixed(1)} trades per session.`);
  }
  if (lossesPerBestTrade >= 2 && stats.largestWin) {
    funFacts.push(`Your best trade on ${stats.largestWin.symbol} covered ${lossesPerBestTrade} average losses.`);
  }

  if (funFacts.length > 0) {
    const factsY = Math.max(bodyEndY + 18, 195);
    fc([15, 15, 25]);
    const factH = funFacts.length * 14 + 18;
    doc.roundedRect(L, factsY, R - L, factH, 5, 5, 'F');
    // Amber accent left border
    fc(amber);
    doc.roundedRect(L, factsY, 3, factH, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    tc(amber);
    doc.text('DID YOU KNOW?', L + 12, factsY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    tc([140, 140, 155]);
    funFacts.forEach((fact, i) => {
      doc.text(`•  ${fact}`, L + 12, factsY + 24 + i * 14);
    });
  }

  // Sign off
  drawLogo(doc, L, H - 50, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  tc(white);
  doc.text('FreeTradeJournal', L + 19, H - 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  tc(dimmer);
  doc.text('See you next period. Trade well.', L + 19, H - 31);

  footer();

  // ─── Save ────────────────────────────────────────────────
  const fileName = `Trading_Wrapped_${format(period.start, 'yyyy-MM-dd')}_to_${format(period.end, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
