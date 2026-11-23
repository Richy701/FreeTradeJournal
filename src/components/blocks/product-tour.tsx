import { SCREENSHOT_HEIGHTS, SCREENSHOT_WIDTHS } from '@/data/landing-screenshot-sizes'
import { useScreenshotMode } from '@/hooks/use-screenshot-mode'
import { ResponsiveImage } from '@/components/responsive-image'

/** One overview here; the feature explorer below provides the detailed views. */
export function ProductTour() {
  const mode = useScreenshotMode()
  return <figure className="mx-auto w-full max-w-6xl">
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <ResponsiveImage
        src={`/images/screenshots/trading-dashboard-screenshot-${mode}.webp`}
        alt="FreeTradeJournal dashboard showing a practice account with 24 trades, net results, win rate, and an equity curve"
        imgClassName="h-auto w-full object-contain"
        sourceWidth={SCREENSHOT_WIDTHS[`trading-dashboard-screenshot-${mode}`]}
        sizes="(max-width: 1192px) calc(100vw - 40px), 1152px"
        width={SCREENSHOT_WIDTHS[`trading-dashboard-screenshot-${mode}`]}
        height={SCREENSHOT_HEIGHTS[`trading-dashboard-screenshot-${mode}`]}
      />
    </div>
    <figcaption className="mt-4 flex flex-col justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
      <span>Your trading day, in one view. Example data shown.</span>
      <a href="#features" className="shrink-0 font-medium text-foreground underline underline-offset-4">Explore each feature below →</a>
    </figcaption>
  </figure>
}
