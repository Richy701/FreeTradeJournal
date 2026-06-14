import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShareNetwork, DownloadSimple, Copy, Check } from '@phosphor-icons/react';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { useLoggingStreak } from '@/hooks/use-logging-streak';
import { useDemoData } from '@/hooks/use-demo-data';
import { toast } from 'sonner';
import { startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

type Period = 'all' | 'month' | 'quarter' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  all: 'All Time',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

interface StatsSnapshot {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  bestTrade: number;
  profitFactor: number;
  avgWin: number;
  currency: string;
  equityCurve: number[];
}

function useStatsSnapshot(period: Period): StatsSnapshot {
  const { getTrades } = useDemoData();
  const { settings } = useSettings();

  let trades = getTrades();

  if (period !== 'all') {
    const now = new Date();
    const cutoff = period === 'month' ? startOfMonth(now)
      : period === 'quarter' ? startOfQuarter(now)
      : startOfYear(now);
    trades = trades.filter((t: any) => new Date(t.exitTime) >= cutoff);
  }

  const totalTrades = trades.length;
  const winsList = trades.filter((t: any) => Number(t.pnl) > 0);
  const lossesList = trades.filter((t: any) => Number(t.pnl) < 0);
  const wins = winsList.length;
  const losses = lossesList.length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalPnl = trades.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0);
  const bestTrade = trades.reduce((best: number, t: any) => Math.max(best, Number(t.pnl) || 0), 0);

  const totalWinPnl = winsList.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0);
  const totalLossPnl = Math.abs(lossesList.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0));
  const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;
  const avgWin = wins > 0 ? totalWinPnl / wins : 0;

  const sorted = [...trades]
    .sort((a: any, b: any) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime());
  let cum = 0;
  const equityCurve = sorted.map((t: any) => { cum += Number(t.pnl) || 0; return cum; });

  return { totalTrades, wins, losses, winRate, totalPnl, bestTrade, profitFactor, avgWin, currency: settings.currency || 'USD', equityCurve };
}

const W = 640;
const H = 640;
const DPR = 2;
const PAD = 36;
const F = 'system-ui, Helvetica, Arial, sans-serif';

function fmt(value: number, currency: string): string {
  const sym = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency === 'JPY' ? '¥' : '$';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${sym}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

interface DrawOptions {
  stats: StatsSnapshot;
  colors: { profit: string; loss: string; primary: string };
  userName: string;
  periodLabel: string;
}

function draw(canvas: HTMLCanvasElement, opts: DrawOptions) {
  const { stats: s, colors: tc, userName, periodLabel } = opts;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = `${W}px`;
  canvas.style.height = 'auto';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(DPR, DPR);

  const accent = tc.primary;
  const accentRgb = hexToRgb(accent);
  const profitRgb = hexToRgb(tc.profit);
  const lossRgb = hexToRgb(tc.loss);

  // -- Background --
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0c0e16');
  bg.addColorStop(1, '#141824');
  ctx.fillStyle = bg;
  rr(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // -- Top accent glow --
  const glow = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, 320);
  glow.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.10)`);
  glow.addColorStop(0.6, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.02)`);
  glow.addColorStop(1, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0)`);
  ctx.save();
  rr(ctx, 0, 0, W, H, 20);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // -- Top edge highlight --
  ctx.save();
  const edgeGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  edgeGrad.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0)`);
  edgeGrad.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`);
  edgeGrad.addColorStop(1, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0)`);
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 0.5);
  ctx.lineTo(W - 100, 0.5);
  ctx.stroke();
  ctx.restore();

  // -- Card border --
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  rr(ctx, 0.5, 0.5, W - 1, H - 1, 20);
  ctx.stroke();

  // -- Header: logo + brand + period --
  const logoSize = 22;
  const logoX = PAD;
  const logoY = 26;

  ctx.fillStyle = '#FFC000';
  rr(ctx, logoX, logoY, logoSize, logoSize, 5);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = `bold 10px ${F}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FTJ', logoX + logoSize / 2, logoY + logoSize / 2 + 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(245,158,11,0.9)';
  ctx.font = `bold 12px ${F}`;
  ctx.fillText('FreeTradeJournal', logoX + logoSize + 8, 42);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `400 12px ${F}`;
  ctx.textAlign = 'right';
  ctx.fillText(periodLabel, W - PAD, 42);
  ctx.textAlign = 'left';

  // -- User identity: initials circle + name --
  let nameBottom = 52;
  if (userName) {
    const circleR = 17;
    const circleX = PAD + circleR;
    const circleY = 80;

    ctx.beginPath();
    ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.15)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    ctx.fillStyle = accent;
    ctx.font = `bold 14px ${F}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, circleX, circleY);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `600 15px ${F}`;
    ctx.letterSpacing = '1.5px';
    ctx.fillText(userName.toUpperCase(), PAD + circleR * 2 + 12, 86);
    ctx.letterSpacing = '0px';

    nameBottom = 112;
  }

  // -- Hero P&L --
  const pnlColor = s.totalPnl >= 0 ? tc.profit : tc.loss;

  ctx.fillStyle = pnlColor;
  ctx.font = `bold 46px ${F}`;
  ctx.fillText(fmt(s.totalPnl, s.currency), PAD, nameBottom + 40);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `500 12px ${F}`;
  ctx.fillText(`${s.totalTrades} trades`, W - PAD, nameBottom + 40);
  ctx.textAlign = 'left';

  const heroBottom = nameBottom + 58;

  // -- Win/Loss bar --
  const barY = heroBottom + 14;
  const barH = 8;
  const barW = W - PAD * 2;
  const barR = 4;

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  rr(ctx, PAD, barY, barW, barH, barR);
  ctx.fill();

  if (s.totalTrades > 0) {
    const winFrac = s.wins / (s.wins + s.losses || 1);
    const winW = Math.round(barW * winFrac);
    const lossW = barW - winW;

    ctx.save();
    rr(ctx, PAD, barY, barW, barH, barR);
    ctx.clip();
    if (winW > 0) {
      ctx.fillStyle = tc.profit;
      ctx.fillRect(PAD, barY, winW, barH);
    }
    if (lossW > 0) {
      ctx.fillStyle = tc.loss;
      ctx.fillRect(PAD + winW, barY, lossW, barH);
    }
    ctx.restore();
  }

  // Bar labels
  const labelY = barY + barH + 16;
  ctx.font = `500 11px ${F}`;
  if (s.wins > 0) {
    ctx.fillStyle = tc.profit;
    ctx.textAlign = 'left';
    ctx.fillText(`${s.winRate}% wins`, PAD, labelY);
  }
  if (s.losses > 0) {
    ctx.fillStyle = tc.loss;
    ctx.textAlign = 'right';
    ctx.fillText(`${100 - s.winRate}% losses`, W - PAD, labelY);
  }
  ctx.textAlign = 'left';

  const barBottom = labelY + 12;

  // -- Equity curve --
  const curveTop = barBottom + 8;
  const curveH = 90;
  const curveW = W - PAD * 2;
  const curveBottom = curveTop + curveH;

  if (s.equityCurve.length >= 2) {
    const pts = s.equityCurve;
    const minVal = Math.min(0, ...pts);
    const maxVal = Math.max(0, ...pts);
    const range = maxVal - minVal || 1;

    const toX = (i: number) => PAD + (i / (pts.length - 1)) * curveW;
    const toY = (v: number) => curveBottom - ((v - minVal) / range) * (curveH - 4) - 2;

    // Zero line
    const zeroY = toY(0);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD, zeroY);
    ctx.lineTo(W - PAD, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Area fill
    const lastPnl = pts[pts.length - 1];
    const areaColor = lastPnl >= 0 ? profitRgb : lossRgb;
    const areaGrad = ctx.createLinearGradient(0, curveTop, 0, curveBottom);
    areaGrad.addColorStop(0, `rgba(${areaColor.r},${areaColor.g},${areaColor.b},0.12)`);
    areaGrad.addColorStop(1, `rgba(${areaColor.r},${areaColor.g},${areaColor.b},0.01)`);

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(pts[0]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(i), toY(pts[i]));
    }
    ctx.lineTo(toX(pts.length - 1), curveBottom);
    ctx.lineTo(toX(0), curveBottom);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(pts[0]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(i), toY(pts[i]));
    }
    ctx.strokeStyle = lastPnl >= 0 ? tc.profit : tc.loss;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // End dot
    const lastX = toX(pts.length - 1);
    const lastY = toY(lastPnl);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lastPnl >= 0 ? tc.profit : tc.loss;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0e16';
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = `400 12px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText('Equity curve builds with more trades', W / 2, curveTop + curveH / 2);
    ctx.textAlign = 'left';
  }

  // -- Divider --
  const divY = curveBottom + 18;
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(0.7, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, divY);
  ctx.lineTo(W - PAD, divY);
  ctx.stroke();

  // -- Stat cards (3) --
  const pf = s.profitFactor === Infinity ? '99+' : s.profitFactor.toFixed(1);
  const cards = [
    { label: 'Best Trade', value: fmt(s.bestTrade, s.currency), color: tc.profit },
    { label: 'Profit Factor', value: pf, color: s.profitFactor >= 1.5 ? tc.profit : s.profitFactor >= 1 ? accent : tc.loss },
    { label: 'Avg Win', value: fmt(s.avgWin, s.currency), color: tc.profit },
  ];
  const cardGap = 14;
  const cardW = (W - PAD * 2 - cardGap * (cards.length - 1)) / cards.length;
  const cardH = 110;
  const cardY = divY + 20;

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const cx = PAD + i * (cardW + cardGap);

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    rr(ctx, cx, cardY, cardW, cardH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    rr(ctx, cx, cardY, cardW, cardH, 14);
    ctx.stroke();

    ctx.fillStyle = c.color;
    ctx.font = `bold 22px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText(c.value, cx + cardW / 2, cardY + 50);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `400 12px ${F}`;
    ctx.fillText(c.label, cx + cardW / 2, cardY + 78);

    ctx.textAlign = 'left';
  }

  // -- Footer --
  const footY = H - 26;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `500 11px ${F}`;
  ctx.textAlign = 'center';
  ctx.fillText('freetradejournal.com', W / 2, footY);
  ctx.textAlign = 'left';
}

export function ShareStatsCard({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const { themeColors } = useThemePresets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [period, setPeriod] = useState<Period>('all');

  const stats = useStatsSnapshot(period);

  const userName = user?.displayName
    || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      draw(canvasRef.current, {
        stats,
        colors: themeColors,
        userName,
        periodLabel: PERIOD_LABELS[period],
      });
      setDrawn(true);
    }
  }, [stats, themeColors, userName, period]);

  useEffect(() => {
    if (!open) { setDrawn(false); return; }
    const t = setTimeout(redraw, 50);
    return () => clearTimeout(t);
  }, [open, redraw]);

  const getBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!canvasRef.current) { resolve(null); return; }
      canvasRef.current.toBlob(resolve, 'image/png');
    });
  }, []);

  const handleDownload = useCallback(async () => {
    const blob = await getBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-trading-stats.png';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Stats card saved');
  }, [getBlob]);

  const handleCopy = useCallback(async () => {
    try {
      const blob = await getBlob();
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  }, [getBlob]);

  const handleShare = useCallback(async () => {
    try {
      const blob = await getBlob();
      if (blob && navigator.share) {
        const file = new File([blob], 'my-trading-stats.png', { type: 'image/png' });
        await navigator.share({ title: 'My Trading Stats', text: 'Tracked with FreeTradeJournal', files: [file] });
      } else {
        handleDownload();
      }
    } catch { /* user cancelled */ }
  }, [getBlob, handleDownload]);

  const accent = themeColors.primary;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2 h-11 touch-manipulation">
            <ShareNetwork className="h-4 w-4" />
            Share Stats
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px] bg-[#0c0e16] border-white/[0.06] p-0 overflow-hidden gap-0 [&>button]:text-white/70 [&>button:hover]:text-white" overlayClassName="backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 pt-5 pb-3 pr-12">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-white/90 text-base font-semibold">Share Your Edge</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="shrink-0 whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
                style={period === p
                  ? { backgroundColor: `${accent}20`, color: accent }
                  : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center px-4 pb-3 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={W * DPR}
            height={H * DPR}
            style={{ width: W, height: 'auto', maxWidth: '100%', borderRadius: 14 }}
          />
        </div>

        <div className="flex gap-2 justify-end px-5 pb-5 pt-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
          >
            <DownloadSimple className="h-3.5 w-3.5" />
            Download
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              <ShareNetwork className="h-3.5 w-3.5" />
              Share
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
