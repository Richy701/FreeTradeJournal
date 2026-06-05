import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useLoggingStreak } from '@/hooks/use-logging-streak';
import { useDemoData } from '@/hooks/use-demo-data';
import { toast } from 'sonner';

interface StatsSnapshot {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  bestTrade: number;
  winStreak: number;
  loggingStreak: number;
  currency: string;
}

function useStatsSnapshot(): StatsSnapshot {
  const { getTrades } = useDemoData();
  const { settings } = useSettings();
  const { streak: loggingStreak } = useLoggingStreak();

  const trades = getTrades();
  const totalTrades = trades.length;
  const wins = trades.filter((t: any) => Number(t.pnl) > 0).length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalPnl = trades.reduce((s: number, t: any) => s + (Number(t.pnl) || 0), 0);
  const bestTrade = trades.reduce((best: number, t: any) => Math.max(best, Number(t.pnl) || 0), 0);

  const sorted = [...trades]
    .sort((a: any, b: any) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime());
  let winStreak = 0;
  for (const t of sorted) {
    if (Number(t.pnl) > 0) winStreak++;
    else break;
  }

  return { totalTrades, winRate, totalPnl, bestTrade, winStreak, loggingStreak, currency: settings.currency || 'USD' };
}

const W = 640;
const H = 440;
const DPR = 2;
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

function draw(canvas: HTMLCanvasElement, s: StatsSnapshot, tc: { profit: string; loss: string }) {
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(DPR, DPR);

  // -- Background --
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0c0e16');
  bg.addColorStop(1, '#141824');
  ctx.fillStyle = bg;
  rr(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // -- Top amber glow --
  const glow = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, 320);
  glow.addColorStop(0, 'rgba(245,158,11,0.10)');
  glow.addColorStop(0.6, 'rgba(245,158,11,0.02)');
  glow.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.save();
  rr(ctx, 0, 0, W, H, 20);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // -- Top edge highlight --
  ctx.save();
  const edgeGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  edgeGrad.addColorStop(0, 'rgba(245,158,11,0)');
  edgeGrad.addColorStop(0.5, 'rgba(245,158,11,0.3)');
  edgeGrad.addColorStop(1, 'rgba(245,158,11,0)');
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

  // -- Header: brand + period --
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(245,158,11,0.9)';
  ctx.font = `bold 12px ${F}`;
  ctx.fillText('FREETRADEJOURNAL', 36, 40);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `400 12px ${F}`;
  ctx.textAlign = 'right';
  ctx.fillText('All Time', W - 36, 40);
  ctx.textAlign = 'left';

  // -- Hero: P&L --
  const pnlColor = s.totalPnl >= 0 ? tc.profit : tc.loss;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `500 14px ${F}`;
  ctx.fillText('Total P&L', 36, 82);

  ctx.fillStyle = pnlColor;
  ctx.font = `bold 48px ${F}`;
  ctx.fillText(fmt(s.totalPnl, s.currency), 36, 132);

  // -- Subtitle stats row --
  const pills = [
    { text: `${s.totalTrades} trades`, color: 'rgba(255,255,255,0.5)' },
    { text: `${s.winRate}% win rate`, color: s.winRate >= 50 ? tc.profit : tc.loss },
    { text: `${s.winStreak} win streak`, color: s.winStreak >= 3 ? tc.profit : 'rgba(255,255,255,0.5)' },
  ];
  let pillX = 36;
  const pillY = 158;
  ctx.font = `500 13px ${F}`;
  for (const pill of pills) {
    const tw = ctx.measureText(pill.text).width;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rr(ctx, pillX, pillY, tw + 20, 26, 13);
    ctx.fill();
    ctx.fillStyle = pill.color;
    ctx.fillText(pill.text, pillX + 10, pillY + 17);
    pillX += tw + 20 + 8;
  }

  // -- Divider --
  const divY = 206;
  const divGrad = ctx.createLinearGradient(36, 0, W - 36, 0);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(0.7, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, divY);
  ctx.lineTo(W - 36, divY);
  ctx.stroke();

  // -- Bottom stat cards --
  const cards = [
    { label: 'Best Trade', value: fmt(s.bestTrade, s.currency), color: tc.profit },
    { label: 'Win Rate', value: `${s.winRate}%`, color: s.winRate >= 50 ? tc.profit : tc.loss },
    { label: 'Trades', value: s.totalTrades.toLocaleString(), color: '#ffffff' },
    { label: 'Streak', value: `${s.loggingStreak}d`, color: s.loggingStreak >= 3 ? '#f59e0b' : '#ffffff' },
  ];
  const cardGap = 14;
  const cardPad = 36;
  const cardW = (W - cardPad * 2 - cardGap * (cards.length - 1)) / cards.length;
  const cardH = 120;
  const cardY = 228;

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const cx = cardPad + i * (cardW + cardGap);

    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    rr(ctx, cx, cardY, cardW, cardH, 14);
    ctx.fill();

    // Card border
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    rr(ctx, cx, cardY, cardW, cardH, 14);
    ctx.stroke();

    // Top accent line
    ctx.strokeStyle = c.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 20, cardY + 1);
    ctx.lineTo(cx + cardW - 20, cardY + 1);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Value
    ctx.fillStyle = c.color;
    ctx.font = `bold 24px ${F}`;
    ctx.textAlign = 'center';
    ctx.fillText(c.value, cx + cardW / 2, cardY + 58);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `400 12px ${F}`;
    ctx.fillText(c.label, cx + cardW / 2, cardY + 82);

    ctx.textAlign = 'left';
  }

  // -- Footer --
  const footY = H - 28;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = `500 11px ${F}`;
  ctx.textAlign = 'left';
  ctx.fillText('freetradejournal.com', 36, footY);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(245,158,11,0.5)';
  ctx.fillText('Track yours free  →', W - 36, footY);
  ctx.textAlign = 'left';
}

export function ShareStatsCard({ children }: { children?: React.ReactNode }) {
  const stats = useStatsSnapshot();
  const { themeColors } = useThemePresets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      draw(canvasRef.current, stats, themeColors);
      setDrawn(true);
    }
  }, [stats, themeColors]);

  useEffect(() => {
    if (!open) { setDrawn(false); return; }
    const t = setTimeout(redraw, 50);
    return () => clearTimeout(t);
  }, [open, redraw]);

  const getBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) =>
      canvasRef.current?.toBlob(resolve, 'image/png') ?? resolve(null)
    );
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
    toast.success('Image downloaded');
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
      toast.error('Failed to copy -- try downloading instead');
    }
  }, [getBlob]);

  const handleShare = useCallback(async () => {
    try {
      const blob = await getBlob();
      if (blob && navigator.share) {
        const file = new File([blob], 'my-trading-stats.png', { type: 'image/png' });
        await navigator.share({ title: 'My Trading Stats', text: 'Check out my trading stats on FreeTradeJournal', files: [file] });
      } else {
        handleDownload();
      }
    } catch { /* user cancelled */ }
  }, [getBlob, handleDownload]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2 h-11 touch-manipulation">
            <Share2 className="h-4 w-4" />
            Share Stats
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Share your stats</DialogTitle>
          <DialogDescription>
            Download or share your trading performance card
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center rounded-xl bg-black/40 p-3 sm:p-5 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={W * DPR}
            height={H * DPR}
            style={{ width: W, height: H, maxWidth: '100%', borderRadius: 16 }}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
