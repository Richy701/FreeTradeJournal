import { useSaleClock } from '@/hooks/use-sale-clock';
import { BLACK_FRIDAY_ENDS_AT, isBlackFriday, isLifetimeOnSale, lifetimeSaleEndsAt } from '@/constants/pricing';

export function SaleCountdown({ plan = 'yearly', prominent = false }: { plan?: 'yearly' | 'lifetime'; prominent?: boolean }) {
  const now = useSaleClock(1000);
  const endsAt = plan === 'lifetime' ? lifetimeSaleEndsAt(now) : BLACK_FRIDAY_ENDS_AT;
  if (!(plan === 'lifetime' ? isLifetimeOnSale(now) : isBlackFriday(now)) || now >= endsAt) return null;
  const seconds = Math.max(0, Math.floor((endsAt - now) / 1000));
  const parts = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  if (prominent) return (
    <div className="min-w-0 max-w-full">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Black Friday ends in</p>
      <div role="timer" aria-live="off" aria-label={`Sale ends ${new Date(endsAt).toUTCString()}`} className="grid grid-cols-4 gap-3 sm:gap-5">
        {parts.map((value, index) => (
          <div key={index} className="min-w-0 border-t border-amber-500/40 pt-2">
            <span className="block text-[clamp(1.75rem,3.5vw,3rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-foreground">{String(value).padStart(2, '0')}</span>
            <span className="mt-2 block text-[0.625rem] sm:text-xs text-muted-foreground">{['Days', 'Hours', 'Minutes', 'Seconds'][index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-muted-foreground">Sale ends in</span>
      <span role="timer" aria-live="off" aria-label={`Sale ends ${new Date(endsAt).toUTCString()}`} className="flex items-baseline gap-3 font-medium tabular-nums text-foreground">
        {parts.map((value, index) => <span key={index}>{String(value).padStart(2, '0')}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{['d', 'h', 'm', 's'][index]}</span></span>)}
      </span>
    </div>
  );
}
