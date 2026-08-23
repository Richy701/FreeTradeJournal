import { TrendUp, TrendDown, Megaphone } from '@phosphor-icons/react'
import { useThemePresets } from '@/contexts/theme-presets'
import { formatIdeaPrice, formatOutcomePnl, OUTCOME_LABELS } from '@/lib/idea-format'
import { IDEA_MARKET_LABELS, plannedRewardRatio, type IdeaAvatar as IdeaAvatarShape, type IdeaDirection, type IdeaMarket, type IdeaOutcome } from '@/types/trade-ideas'
import { IdeaAvatar } from './idea-avatar'

export interface IdeaPreview {
  avatar: IdeaAvatarShape
  handle: string
  market: IdeaMarket
  symbol: string
  direction: IdeaDirection
  entry: number | null
  stop: number | null
  target: number | null
  outcome?: IdeaOutcome | null
  when?: string
  /** Team update: no levels row, a title instead. */
  post?: { title: string }
}

/**
 * A live, compact version of an idea card used at the top of every Trade
 * Ideas dialog so people see what they are about to post, link or report.
 * Empty values render as placeholders instead of hiding the row.
 */
export function IdeaPreviewCard({ preview, caption }: { preview: IdeaPreview; caption: string }) {
  const { themeColors, alpha } = useThemePresets()
  const isLong = preview.direction === 'long'
  const dirColor = isLong ? themeColors.profit : themeColors.loss
  const DirIcon = isLong ? TrendUp : TrendDown
  const { entry, stop, target } = preview
  const ratio = entry !== null && stop !== null && target !== null ? plannedRewardRatio({ entry, stop, target }) : null
  const risk = entry !== null && stop !== null ? Math.abs(entry - stop) : null
  const reward = entry !== null && target !== null ? Math.abs(target - entry) : null
  const outcome = preview.outcome ?? null
  const outcomeColor = outcome ? (outcome.result === 'win' ? themeColors.profit : outcome.result === 'loss' ? themeColors.loss : undefined) : undefined

  const cell = (label: string, value: number | null) => (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-semibold truncate">{value === null ? <span className="text-muted-foreground font-normal">–</span> : formatIdeaPrice(value)}</dd>
    </div>
  )

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: alpha(themeColors.primary, '06') }}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{caption}</p>
      <div className="flex items-center gap-2.5 min-w-0">
        <IdeaAvatar avatar={preview.avatar} handle={preview.handle || 'you'} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold truncate">@{preview.handle || 'yourname'}</p>
          <p className="text-xs text-muted-foreground truncate">{preview.when ?? 'just now'} · {preview.post ? 'FreeTradeJournal team' : IDEA_MARKET_LABELS[preview.market]}</p>
        </div>
        {preview.post ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
            style={{ backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }}
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" weight="bold" aria-hidden="true" />
            Team update
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 max-w-[45%]"
            style={{ backgroundColor: alpha(dirColor, '15'), color: dirColor }}
          >
            <DirIcon className="h-3.5 w-3.5 shrink-0" weight="bold" aria-hidden="true" />
            <span className="truncate">{isLong ? 'Long' : 'Short'} {preview.symbol || '…'}</span>
          </span>
        )}
      </div>
      {preview.post ? (
        <p className="text-base font-semibold leading-snug truncate">{preview.post.title || <span className="text-muted-foreground font-normal">Untitled update</span>}</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm tabular-nums">
          {cell('Entry', entry)}
          {cell('Stop', stop)}
          {cell('Target', target)}
        </dl>
      )}
      {!preview.post && <div className="flex items-center justify-between gap-2 text-xs min-h-[1.25rem]">
        <p className="text-muted-foreground tabular-nums truncate" aria-live="polite">
          {risk !== null && (
            <>
              Risk {formatIdeaPrice(risk)}
              {reward !== null && <> · Reward {formatIdeaPrice(reward)}</>}
              {ratio !== null && <> · <span className="font-semibold text-foreground">{ratio.toFixed(1)}R</span> planned</>}
            </>
          )}
          {risk === null && 'Add an entry and stop to see the risk.'}
        </p>
        {outcome && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums shrink-0"
            style={outcomeColor ? { borderColor: alpha(outcomeColor, '40'), color: outcomeColor, backgroundColor: alpha(outcomeColor, '10') } : undefined}
          >
            {OUTCOME_LABELS[outcome.result]}
            <span className="font-medium">{formatOutcomePnl(outcome.pnl, outcome.currency)}</span>
          </span>
        )}
      </div>}
    </div>
  )
}
