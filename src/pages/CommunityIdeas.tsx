import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { UsersThree, Plus, ArrowClockwise, CircleNotch, ListChecks, UserCircle, PencilSimple, Warning } from '@phosphor-icons/react'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { NoticeBanner } from '@/components/notice-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FeedbackButton } from '@/components/ui/feedback-button'
import { IdeaCard } from '@/components/trade-ideas/idea-card'
import { IdeaAvatar } from '@/components/trade-ideas/idea-avatar'
import { RoleTag } from '@/components/trade-ideas/role-tag'
import { PostIdeaDialog } from '@/components/trade-ideas/post-idea-dialog'
import { LinkTradeDialog } from '@/components/trade-ideas/link-trade-dialog'
import { ReportIdeaDialog } from '@/components/trade-ideas/report-idea-dialog'
import { AvatarDialog } from '@/components/trade-ideas/avatar-dialog'
import { CommunityRulesList, CommunityRulesDialog } from '@/components/trade-ideas/community-rules'
import { WelcomeDialog } from '@/components/trade-ideas/welcome-dialog'
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useIdeaFeed, type IdeaFeedScope } from '@/hooks/use-idea-feed'
import { useUserStorage } from '@/utils/user-storage'
import { toggleIdeaLike, deleteTradeIdea, moderateTradeIdea, callableMessage, isPostingBlocked } from '@/lib/trade-ideas'
import { trackEvent } from '@/lib/analytics'
import { profileHitRate, type CommunityIdea } from '@/types/trade-ideas'

const BETA_NOTICE_KEY = 'tradeIdeasBetaNoticeDismissed'
const WELCOME_SEEN_KEY = 'tradeIdeasWelcomeSeen'

export default function CommunityIdeas() {
  const { themeColors, alpha } = useThemePresets()
  const { user } = useAuth()
  const demoGuard = useDemoGuard()
  const userStorage = useUserStorage()
  const uid = user?.uid ?? null

  const [searchParams, setSearchParams] = useSearchParams()
  const scope: IdeaFeedScope = searchParams.get('scope') === 'mine' ? 'mine' : 'latest'
  const setScope = (next: IdeaFeedScope) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'mine') params.set('scope', 'mine')
    else params.delete('scope')
    setSearchParams(params, { replace: true })
  }

  const feed = useIdeaFeed(scope)
  const { profile } = feed
  const profileLoaded = profile !== undefined && profile !== 'error'
  const hasHandle = profileLoaded && !!profile
  const blocked = isPostingBlocked(feed.moderation)
  const isDev = hasHandle && !!profile && profile.role === 'dev'

  const [postOpen, setPostOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [linkIdea, setLinkIdea] = useState<CommunityIdea | null>(null)
  const [reportIdea, setReportIdea] = useState<CommunityIdea | null>(null)
  const [deleteIdea, setDeleteIdea] = useState<CommunityIdea | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set())
  const [likeBusy, setLikeBusy] = useState<Set<string>>(() => new Set())
  const [reportedIds, setReportedIds] = useState<Set<string>>(() => new Set())
  const [showBetaNotice, setShowBetaNotice] = useState(() => userStorage.getItem(BETA_NOTICE_KEY) !== '1')
  // First visit: a one-time welcome explaining the feed. Stamped as seen when
  // it closes, however it closes.
  const [welcomeOpen, setWelcomeOpen] = useState(() => userStorage.getItem(WELCOME_SEEN_KEY) !== '1')
  const closeWelcome = () => {
    setWelcomeOpen(false)
    void userStorage.setItem(WELCOME_SEEN_KEY, '1')
  }

  useEffect(() => {
    trackEvent('trade_ideas_viewed', { scope })
  }, [scope])

  useEffect(() => {
    if (welcomeOpen) trackEvent('trade_ideas_welcome_shown')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissBetaNotice = () => {
    setShowBetaNotice(false)
    void userStorage.setItem(BETA_NOTICE_KEY, '1')
  }

  // Demo visitors can open the composer and the link dialog to see how they
  // work; the guard fires when they try to submit (inside each dialog).
  const openPost = () => {
    if (blocked) return
    trackEvent('trade_idea_post_opened', { hasHandle })
    setPostOpen(true)
  }
  const openLink = (idea: CommunityIdea) => {
    trackEvent('trade_idea_link_opened')
    setLinkIdea(idea)
  }

  const handleToggleLike = async (idea: CommunityIdea) => {
    if (demoGuard('like ideas')) return
    if (likeBusy.has(idea.id)) return
    setLikeBusy(prev => new Set(prev).add(idea.id))
    const wasLiked = feed.likedIds.has(idea.id)
    feed.adjustLike(idea.id, !wasLiked, wasLiked ? -1 : 1)
    try {
      const res = await toggleIdeaLike(idea.id)
      feed.settleLike(idea.id, res.liked, res.likeCount)
    } catch (err) {
      feed.adjustLike(idea.id, wasLiked, wasLiked ? 1 : -1)
      toast.error(callableMessage(err, 'Could not save that like.'))
    } finally {
      setLikeBusy(prev => {
        const next = new Set(prev)
        next.delete(idea.id)
        return next
      })
    }
  }

  // The confirm dialog closes straight away, so the card itself has to show
  // the delete is happening: it fades and a loading toast sits until the call
  // returns, instead of nothing changing for the length of the request.
  const handleDelete = async () => {
    const idea = deleteIdea
    if (!idea) return
    setDeleteIdea(null)
    setDeletingIds(prev => new Set(prev).add(idea.id))
    const toastId = toast.loading('Deleting idea')
    try {
      await deleteTradeIdea(idea.id)
      feed.removeIdea(idea.id)
      void feed.refreshProfile()
      toast.success('Idea deleted', { id: toastId })
    } catch (err) {
      toast.error(callableMessage(err, 'Could not delete that idea.'), { id: toastId })
    } finally {
      setDeletingIds(prev => { const next = new Set(prev); next.delete(idea.id); return next })
    }
  }

  const handleModerate = async (idea: CommunityIdea, action: 'hide' | 'unhide') => {
    try {
      const status = await moderateTradeIdea(idea.id, action)
      if (status === 'hidden' && scope === 'latest') feed.removeIdea(idea.id)
      else feed.replaceIdea(idea.id, { status })
      toast.success(status === 'hidden' ? 'Idea hidden' : 'Idea back on the feed')
    } catch (err) {
      toast.error(callableMessage(err, 'Could not change that idea.'))
    }
  }

  const handleLoadMore = async () => {
    const ok = await feed.loadMore()
    if (!ok) toast.error('Could not load more ideas. Try again.')
  }

  const hit = hasHandle && profile ? profileHitRate(profile) : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5 hidden sm:block" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <UsersThree className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Trade Ideas</h1>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: alpha(themeColors.primary, '15'), color: themeColors.primary }}
                >
                  Beta
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Setups from other FreeTradeJournal traders, with the result once they link the trade.
              </p>
            </div>
            <Button
              onClick={openPost}
              disabled={blocked}
              className="gap-2 shrink-0 w-full sm:w-auto"
              style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
            >
              <Plus className="h-4 w-4" weight="bold" aria-hidden="true" />
              Post an idea
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="min-w-0 space-y-4">
          {blocked && (
            <NoticeBanner
              tone="warning"
              icon={Warning}
              title="Posting is switched off for this account"
              description="Several of your ideas were reported. You can still read and like. Email support@freetradejournal.com if you think this is wrong."
            />
          )}

          {showBetaNotice && (
            <NoticeBanner
              tone="info"
              icon={UsersThree}
              title="Trade Ideas is in beta"
              description="Anyone signed in can read and post. Ideas are not financial advice. Report anything that should not be here and tell us what you would change."
              actions={<FeedbackButton variant="outline" buttonText="Send feedback" context="trade-ideas-beta" className="h-8 text-xs" />}
              onDismiss={dismissBetaNotice}
            />
          )}

          {/* Scope */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5" role="group" aria-label="Which ideas to show">
              {([['latest', 'Latest'], ['mine', 'My ideas']] as const).map(([value, label]) => {
                const active = scope === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setScope(value)}
                    className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40"
                    style={{
                      borderColor: active ? themeColors.primary : 'hsl(var(--border))',
                      backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
                      color: active ? themeColors.primary : undefined,
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => feed.reload()}
                aria-label="Refresh"
                disabled={feed.loading || feed.loadingMore}
              >
                <ArrowClockwise className={`h-4 w-4 ${feed.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Feed */}
          {feed.loading ? (
            <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading ideas">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-xl border p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : feed.error ? (
            <div className="rounded-xl border border-dashed bg-card/50 flex flex-col items-center justify-center py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">{feed.error}</p>
              <Button variant="outline" size="sm" onClick={() => feed.reload()}>Try again</Button>
            </div>
          ) : feed.ideas.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/50 flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                <UsersThree className="h-8 w-8" style={{ color: themeColors.primary }} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">{scope === 'mine' ? 'You have not posted an idea yet' : 'No ideas yet'}</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                {scope === 'mine'
                  ? 'Post a setup before you take it, then link the trade afterwards so the result shows next to it.'
                  : 'Be the first. Post a setup with your entry, stop and target, and why you like it.'}
              </p>
              <Button onClick={openPost} disabled={blocked} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                <Plus className="h-4 w-4 mr-2" weight="bold" aria-hidden="true" />
                Post an idea
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.ideas.map(idea => (
                <div
                  key={idea.id}
                  className={deletingIds.has(idea.id) ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}
                  aria-busy={deletingIds.has(idea.id) || undefined}
                >
                  <IdeaCard
                    idea={idea}
                    isOwn={!!uid && idea.authorUid === uid}
                    liked={feed.likedIds.has(idea.id)}
                    likeBusy={likeBusy.has(idea.id)}
                    reported={reportedIds.has(idea.id)}
                    moderator={isDev}
                    onModerate={handleModerate}
                    onToggleLike={handleToggleLike}
                    onReport={i => { if (!demoGuard('report ideas')) setReportIdea(i) }}
                    onDelete={i => { if (!demoGuard('delete ideas')) setDeleteIdea(i) }}
                    onLinkTrade={openLink}
                  />
                </div>
              ))}
              {!feed.done && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={handleLoadMore} disabled={feed.loadingMore} className="gap-2">
                    {feed.loadingMore && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side column: your record + the rules. Stacks under the feed on phones;
            sticks below the 4rem site header on desktop. */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                Your record
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {profile === undefined ? (
                <div className="space-y-3" role="status" aria-label="Loading your record">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : profile === 'error' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Could not load your record.</p>
                  <Button size="sm" variant="outline" onClick={() => feed.refreshProfile()}>Try again</Button>
                </div>
              ) : profile ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IdeaAvatar avatar={profile} handle={profile.handle} size="md" />
                    <p className="text-base font-semibold flex-1 min-w-0 flex items-center gap-1.5">
                      <span className="truncate">@{profile.handle}</span>
                      <RoleTag role={profile.role} />
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => setAvatarOpen(true)}
                    >
                      <PencilSimple className="h-3.5 w-3.5" aria-hidden="true" />
                      Avatar
                    </Button>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center tabular-nums">
                    {([
                      ['Ideas', String(profile.ideaCount)],
                      ['Worked', hit ? String(profile.winCount) : '–'],
                      ['Hit rate', hit ? `${Math.round(hit.rate * 100)}%` : '–'],
                    ] as const).map(([label, value]) => (
                      <div key={label} className="rounded-lg border bg-muted/30 py-2.5 flex flex-col-reverse">
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                        <dd className="text-lg font-bold leading-tight">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {hit
                      ? `${hit.decided} of your ${profile.ideaCount} ${profile.ideaCount === 1 ? 'idea has' : 'ideas have'} a linked trade.`
                      : 'Link a trade to an idea and the result shows here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Pick a handle and avatar the first time you post.
                  </p>
                  <Button size="sm" variant="outline" className="gap-2" onClick={openPost} disabled={blocked}>
                    <Plus className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
                    Post your first idea
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
                Community rules
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <CommunityRulesList />
            </CardContent>
          </Card>
        </aside>
        </div>
      </div>

      <AppFooter />

      <PostIdeaDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        profile={profile}
        onHandleClaimed={feed.setProfile}
        onShowRules={() => setRulesOpen(true)}
        onRetryProfile={() => feed.refreshProfile()}
        onPosted={() => {
          void feed.reload()
          void feed.refreshProfile()
        }}
      />
      <CommunityRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
      <WelcomeDialog
        open={welcomeOpen}
        onOpenChange={open => { if (!open) closeWelcome() }}
        onPost={() => { closeWelcome(); openPost() }}
        onShowRules={() => { closeWelcome(); setRulesOpen(true) }}
      />
      {hasHandle && profile && (
        <AvatarDialog
          open={avatarOpen}
          onOpenChange={setAvatarOpen}
          profile={profile}
          onSaved={avatar => {
            feed.setProfile({ ...profile, ...avatar })
            if (uid) feed.patchAll(i => i.authorUid === uid, avatar)
          }}
        />
      )}
      <LinkTradeDialog
        idea={linkIdea}
        onOpenChange={open => { if (!open) setLinkIdea(null) }}
        onLinked={(ideaId, outcome) => {
          feed.replaceIdea(ideaId, { outcome })
          void feed.refreshProfile()
        }}
      />
      <ReportIdeaDialog
        idea={reportIdea}
        onOpenChange={open => { if (!open) setReportIdea(null) }}
        onReported={(ideaId, hidden) => {
          setReportedIds(prev => new Set(prev).add(ideaId))
          if (hidden) feed.removeIdea(ideaId)
        }}
      />
      <ConfirmDialog
        open={deleteIdea !== null}
        onOpenChange={open => { if (!open) setDeleteIdea(null) }}
        title="Delete this idea?"
        description={deleteIdea && uid && deleteIdea.authorUid !== uid
          ? `This removes @${deleteIdea.handle}'s idea for everyone, along with its likes and linked result.`
          : 'It comes off the feed for everyone, along with its likes and linked result. Deleted ideas still count towards your 5 a day.'}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
