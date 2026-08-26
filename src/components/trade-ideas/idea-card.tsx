import { useState } from 'react'
import { Heart, DotsThree, Flag, Trash, LinkSimple, TrendUp, TrendDown, EyeSlash, Eye, Megaphone } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useThemePresets } from '@/contexts/theme-presets'
import { formatRelativeTime } from '@/lib/relative-time'
import { IDEA_MARKET_LABELS, plannedRewardRatio, type CommunityIdea } from '@/types/trade-ideas'
import { formatIdeaPrice, formatOutcomePnl, OUTCOME_LABELS } from '@/lib/idea-format'
import { IdeaAvatar } from './idea-avatar'
import { RoleTag } from './role-tag'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface IdeaCardProps {
  idea: CommunityIdea
  isOwn: boolean
  liked: boolean
  likeBusy?: boolean
  reported?: boolean
  /** Viewer is a dev account: can hide, unhide and delete any idea. */
  moderator?: boolean
  onToggleLike: (idea: CommunityIdea) => void
  onReport: (idea: CommunityIdea) => void
  onDelete: (idea: CommunityIdea) => void
  onLinkTrade: (idea: CommunityIdea) => void
  onModerate?: (idea: CommunityIdea, action: 'hide' | 'unhide') => void
}

export function IdeaCard({ idea, isOwn, liked, likeBusy, reported, moderator, onToggleLike, onReport, onDelete, onLinkTrade, onModerate }: IdeaCardProps) {
  const { themeColors, alpha } = useThemePresets()
  const [imageOpen, setImageOpen] = useState(false)
  const isLong = idea.direction === 'long'
  const dirColor = isLong ? themeColors.profit : themeColors.loss
  const DirIcon = isLong ? TrendUp : TrendDown
  const ratio = plannedRewardRatio(idea)
  const outcome = idea.outcome
  const hidden = idea.status === 'hidden'
  const isPost = idea.kind === 'post'

  const outcomeColor = outcome
    ? outcome.result === 'win'
      ? themeColors.profit
      : outcome.result === 'loss'
        ? themeColors.loss
        : undefined
    : undefined

  return (
    <TooltipProvider delayDuration={300}>
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2 min-w-0">
          <IdeaAvatar avatar={idea} handle={idea.handle} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold truncate flex items-center gap-1.5">
              <span className="truncate">@{idea.handle}</span>
              <RoleTag role={idea.authorRole} />
            </p>
            <p className="text-xs text-muted-foreground truncate">
              <time dateTime={idea.createdAt.toISOString()}>{formatRelativeTime(idea.createdAt)}</time>
              {' · '}
              {isPost ? 'FreeTradeJournal team' : IDEA_MARKET_LABELS[idea.market] ?? idea.market}
            </p>
          </div>
          {isPost ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
              style={{ backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }}
            >
              <Megaphone className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
              Team update
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
              style={{ backgroundColor: alpha(dirColor, '15'), color: dirColor }}
            >
              <DirIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
              {isLong ? 'Long' : 'Short'} {idea.symbol}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label={`More options for @${idea.handle}'s ${idea.symbol} idea`}>
                <DotsThree className="h-5 w-5" weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwn ? (
                <>
                  {!isPost && (
                    <DropdownMenuItem onSelect={() => onLinkTrade(idea)}>
                      <LinkSimple className="h-4 w-4 mr-2" aria-hidden="true" />
                      {outcome ? 'Change linked trade' : 'Link a trade'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => onDelete(idea)} className="text-destructive focus:text-destructive">
                    <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete idea
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => onReport(idea)} disabled={reported}>
                  <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
                  {reported ? 'Reported' : 'Report'}
                </DropdownMenuItem>
              )}
              {moderator && !isOwn && (
                <>
                  <DropdownMenuItem onSelect={() => onModerate?.(idea, hidden ? 'unhide' : 'hide')}>
                    {hidden ? <Eye className="h-4 w-4 mr-2" aria-hidden="true" /> : <EyeSlash className="h-4 w-4 mr-2" aria-hidden="true" />}
                    {hidden ? 'Unhide (dev)' : 'Hide (dev)'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onDelete(idea)} className="text-destructive focus:text-destructive">
                    <Trash className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete (dev)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isPost && idea.title && (
          <h3 className="text-base font-semibold leading-snug">{idea.title}</h3>
        )}

        {/* Levels. The planned R sits in the label row so it never gets truncated on phones. */}
        {!isPost && <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm tabular-nums">
          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Entry</dt>
            <dd className="font-semibold truncate">{formatIdeaPrice(idea.entry)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Stop</dt>
            <dd className="font-semibold truncate">{idea.stop === null ? <span className="text-muted-foreground">Not set</span> : formatIdeaPrice(idea.stop)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
              Target{ratio !== null && <span className="normal-case tracking-normal"> · {ratio.toFixed(1)}R</span>}
            </dt>
            <dd className="font-semibold truncate">{idea.target === null ? <span className="text-muted-foreground">Not set</span> : formatIdeaPrice(idea.target)}</dd>
          </div>
        </dl>}

        {hidden && (
          <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2">
            {isOwn ? 'Hidden from the feed after reports. Only you can see it.' : 'Hidden from the feed. Only the poster and dev accounts can see it.'}
          </p>
        )}

        <p className="text-sm leading-relaxed whitespace-pre-line break-words">{idea.reasoning}</p>

        {idea.imageUrl && (
          <button
            type="button"
            onClick={() => setImageOpen(v => !v)}
            className="block w-full overflow-hidden rounded-lg border bg-muted/30"
            aria-expanded={imageOpen}
            aria-label={imageOpen ? 'Shrink chart image' : 'Expand chart image'}
          >
            <img
              src={idea.imageUrl}
              alt={isPost ? `Image from @${idea.handle}'s update` : `Chart for ${idea.symbol} ${idea.direction} idea by @${idea.handle}`}
              loading="lazy"
              className={imageOpen ? 'w-full h-auto' : 'w-full h-48 sm:h-56 object-cover object-top'}
            />
            {idea.imageSource === 'giphy' && (
              <span className="block px-2 py-1 text-[11px] text-muted-foreground text-right">via GIPHY</span>
            )}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-1">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* span keeps the tooltip working when the button is disabled */}
              <span className="inline-flex -ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2"
                  onClick={() => onToggleLike(idea)}
                  disabled={likeBusy || hidden || isOwn}
                  aria-pressed={liked}
                  aria-label={`${liked ? 'Unlike' : 'Like'}, ${idea.likeCount} ${idea.likeCount === 1 ? 'like' : 'likes'}`}
                  style={liked ? { color: themeColors.primary } : undefined}
                >
                  <Heart className="h-4 w-4" weight={liked ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="tabular-nums text-sm">{idea.likeCount}</span>
                </Button>
              </span>
            </TooltipTrigger>
            {isOwn && <TooltipContent>You cannot like your own idea</TooltipContent>}
          </Tooltip>
          <div className="ml-auto flex items-center gap-2 min-w-0">
            {isPost ? null : outcome ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums"
                    style={outcomeColor ? { borderColor: alpha(outcomeColor, '40'), color: outcomeColor, backgroundColor: alpha(outcomeColor, '10') } : undefined}
                  >
                    {OUTCOME_LABELS[outcome.result]}
                    <span className="font-medium">{formatOutcomePnl(outcome.pnl, outcome.currency)}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Linked by the poster from their own Trade Log</TooltipContent>
              </Tooltip>
            ) : isOwn && !hidden ? (
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => onLinkTrade(idea)}>
                <LinkSimple className="h-3.5 w-3.5" aria-hidden="true" />
                Link a trade
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No result yet</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}
