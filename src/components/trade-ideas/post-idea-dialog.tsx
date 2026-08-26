import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { UsersThree, X, Image as ImageIcon, Check, CircleNotch, TrendUp, TrendDown, Lightbulb, Megaphone, Gif } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { InstrumentCombobox } from '@/components/instrument-combobox'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useUserStorage } from '@/utils/user-storage'
import { instrumentGroupsFor, type MarketType } from '@/constants/trading'
import { AVATAR_COLORS, AVATAR_EMOJIS, DEFAULT_AVATAR_COLOR } from '@/constants/avatars'
import { compressImage, readFileAsDataURL } from '@/utils/image-store'
import { claimHandle, postTradeIdea, postTeamUpdate, isHandleAvailable, callableMessage } from '@/lib/trade-ideas'
import { TRADE_IDEA_LINK_RE } from '@/constants/trade-idea-rules'
import {
  IDEA_MARKETS,
  IDEA_MARKET_LABELS,
  type IdeaAvatar,
  type IdeaDirection,
  type IdeaMarket,
  type IdeaProfile,
} from '@/types/trade-ideas'
import type { IdeaProfileState } from '@/hooks/use-idea-feed'
import { AvatarPicker } from './avatar-picker'
import { IdeaPreviewCard } from './idea-preview-card'
import { GifPicker, type PickedGif } from './gif-picker'
import { parseLevel } from '@/lib/idea-format'

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/
const REASONING_MAX = 1000
const REASONING_MIN = 10
const PICKER_MARKETS: ReadonlySet<IdeaMarket> = new Set(['forex', 'futures', 'indices'])

interface PostIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: IdeaProfileState
  onHandleClaimed: (profile: IdeaProfile) => void
  onPosted: () => void
  onShowRules: () => void
  onRetryProfile: () => void
}

export function PostIdeaDialog({ open, onOpenChange, profile, onHandleClaimed, onPosted, onShowRules, onRetryProfile }: PostIdeaDialogProps) {
  const { themeColors, alpha } = useThemePresets()
  const demoGuard = useDemoGuard()
  const userStorage = useUserStorage()
  const step: 'loading' | 'error' | 'handle' | 'form' =
    profile === undefined ? 'loading' : profile === 'error' ? 'error' : profile?.handle ? 'form' : 'handle'

  // ── Handle step ──
  const [handle, setHandle] = useState('')
  const [handleCheck, setHandleCheck] = useState<'idle' | 'checking' | 'free' | 'taken' | 'unknown'>('idle')
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  // Start from the avatar the user already picked on their Profile, if any.
  const [avatar, setAvatar] = useState<IdeaAvatar>(() => {
    const emoji = userStorage.getItem('avatarEmoji') || ''
    const color = userStorage.getItem('avatarColor') || ''
    return {
      avatarEmoji: (AVATAR_EMOJIS as readonly string[]).includes(emoji) ? emoji : null,
      avatarColor: (AVATAR_COLORS as readonly string[]).includes(color) ? color : DEFAULT_AVATAR_COLOR,
    }
  })

  const cleanHandle = handle.trim().replace(/^@/, '')
  const handleValid = HANDLE_RE.test(cleanHandle)

  useEffect(() => {
    if (step !== 'handle') return
    if (!handleValid) {
      setHandleCheck('idle')
      return
    }
    let cancelled = false
    setHandleCheck('checking')
    const t = setTimeout(() => {
      isHandleAvailable(cleanHandle)
        .then(free => { if (!cancelled) setHandleCheck(free ? 'free' : 'taken') })
        // The claim itself is the authority; a failed check must not freeze the button.
        .catch(() => { if (!cancelled) setHandleCheck('unknown') })
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [cleanHandle, handleValid, step])

  const canClaim = !claiming && handleValid && (handleCheck === 'free' || handleCheck === 'unknown')

  const submitHandle = async () => {
    if (!canClaim) return
    if (demoGuard('pick a handle')) return
    setClaiming(true)
    setClaimError(null)
    try {
      const saved = await claimHandle(cleanHandle, avatar)
      onHandleClaimed({ ...saved, ideaCount: 0, winCount: 0, lossCount: 0, breakevenCount: 0 })
      toast.success(`You are @${saved.handle}`)
    } catch (err) {
      setClaimError(callableMessage(err, 'Could not claim that handle. Try again.'))
    } finally {
      setClaiming(false)
    }
  }

  // ── Form step ──
  const isDev = !!profile && profile !== 'error' && profile.role === 'dev'
  const [composer, setComposer] = useState<'idea' | 'post'>('idea')
  const [postTitle, setPostTitle] = useState('')
  const [postBody, setPostBody] = useState('')
  const POST_BODY_MAX = 2000
  const [market, setMarket] = useState<IdeaMarket>('forex')
  const [symbol, setSymbol] = useState('')
  const [direction, setDirection] = useState<IdeaDirection>('long')
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [gif, setGif] = useState<PickedGif | null>(null)
  const [gifOpen, setGifOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const groups = useMemo(
    () => (PICKER_MARKETS.has(market) ? instrumentGroupsFor(market as MarketType, symbol || undefined) : []),
    [market, symbol],
  )

  const reset = () => {
    setMarket('forex'); setSymbol(''); setDirection('long')
    setEntry(''); setStop(''); setTarget(''); setReasoning(''); setImage(null); setGif(null); setGifOpen(false); setPostError(null)
    setPostTitle(''); setPostBody(''); setComposer('idea')
  }

  const entryN = parseLevel(entry)
  const stopN = parseLevel(stop)
  const targetN = parseLevel(target)
  const allNumbers = [entryN, stopN, targetN].every(n => n === null || !Number.isNaN(n))

  const levelError = (() => {
    if (!allNumbers) return 'Levels must be numbers.'
    if (entryN === null) return null
    if (entryN <= 0) return 'Entry must be above zero.'
    if (direction === 'long') {
      if (stopN !== null && stopN >= entryN) return 'For a long, the stop goes below the entry.'
      if (targetN !== null && targetN <= entryN) return 'For a long, the target goes above the entry.'
    } else {
      if (stopN !== null && stopN <= entryN) return 'For a short, the stop goes above the entry.'
      if (targetN !== null && targetN >= entryN) return 'For a short, the target goes below the entry.'
    }
    return null
  })()

  const hasLink = TRADE_IDEA_LINK_RE.test(reasoning)
  const reasoningShort = reasoning.trim().length > 0 && reasoning.trim().length < REASONING_MIN

  // What still stops the idea going out, in the order the form reads.
  const missing: string[] = []
  if (!symbol.trim()) missing.push('pick a symbol')
  if (entryN === null) missing.push('add an entry')
  if (stopN === null) missing.push('add a stop')
  if (levelError) missing.push('fix the levels')
  if (reasoning.trim().length < REASONING_MIN) missing.push('say why (at least a sentence)')
  if (hasLink) missing.push('remove the link')
  const canPost = missing.length === 0 && reasoning.length <= REASONING_MAX && !posting

  const pickFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.warning('Only images can be attached.')
      return
    }
    // GIFs go up as-is: re-encoding through a canvas would freeze the animation.
    if (file.type === 'image/gif') {
      if (file.size > 4 * 1024 * 1024) {
        toast.warning('GIFs must be under 4MB.')
        return
      }
      try {
        setImage(await readFileAsDataURL(file))
      } catch {
        toast.error('Could not read that GIF.')
      }
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.warning('That image is too large (max 15MB).')
      return
    }
    try {
      const dataUrl = await compressImage(file, 1400, 0.8)
      if (dataUrl.length > 2_000_000) {
        toast.warning('That image is still too large after compression. Try a tighter crop.')
        return
      }
      setImage(dataUrl)
    } catch {
      toast.error('Could not read that image.')
    }
  }

  const updateMissing = postBody.trim().length < REASONING_MIN ? 'Write at least a sentence to post.' : null
  const canPostUpdate = !updateMissing && postBody.length <= POST_BODY_MAX && !posting

  const submitUpdate = async () => {
    if (!canPostUpdate) return
    if (demoGuard('post a team update')) return
    setPosting(true)
    setPostError(null)
    try {
      await postTeamUpdate({ title: postTitle.trim(), body: postBody.trim(), image: gif ? null : image, gifUrl: gif?.url ?? null })
      toast.success('Update posted')
      reset()
      onOpenChange(false)
      onPosted()
    } catch (err) {
      setPostError(callableMessage(err, 'Could not post that update. Try again.'))
    } finally {
      setPosting(false)
    }
  }

  const submit = async () => {
    if (!canPost || entryN === null || stopN === null) return
    if (demoGuard('post a trade idea')) return
    setPosting(true)
    setPostError(null)
    try {
      await postTradeIdea({
        symbol: symbol.trim().toUpperCase(),
        market,
        direction,
        entry: entryN,
        stop: stopN,
        target: targetN,
        reasoning: reasoning.trim(),
        image: gif ? null : image,
        gifUrl: gif?.url ?? null,
      })
      toast.success('Idea posted')
      reset()
      onOpenChange(false)
      onPosted()
    } catch (err) {
      setPostError(callableMessage(err, 'Could not post that idea. Try again.'))
    } finally {
      setPosting(false)
    }
  }


  // Attachment: an uploaded image, a GIF from the search, or nothing.
  const renderAttachment = (label: string, dropCopy: string) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {!image && !gif && !gifOpen && (
          <button type="button" onClick={() => setGifOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Gif className="h-4 w-4" aria-hidden="true" />
            Search GIFs
          </button>
        )}
      </div>
      {gif ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={gif.preview} alt={gif.title || 'Chosen GIF'} className="w-full h-40 object-cover object-center" />
          <span className="absolute bottom-1.5 right-2 text-[11px] text-white/90 drop-shadow">via GIPHY</span>
          <Button type="button" variant="secondary" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setGif(null)} aria-label="Remove GIF">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : image ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={image} alt="Image to attach" className="w-full h-40 object-cover object-top" />
          <Button type="button" variant="secondary" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setImage(null)} aria-label="Remove image">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : gifOpen ? (
        <GifPicker onPick={g => { setGif(g); setGifOpen(false) }} onClose={() => setGifOpen(false)} />
      ) : (
        <label
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground cursor-pointer transition-colors hover:bg-muted/30"
          style={dragging ? { borderColor: alpha(themeColors.primary, '50'), backgroundColor: alpha(themeColors.primary, '05') } : undefined}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); void pickFile(e.dataTransfer.files?.[0]) }}
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          {dropCopy}
          <input type="file" accept="image/*" className="hidden" aria-label={label} onChange={e => { void pickFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      )}
    </div>
  )

  const pill = (active: boolean) => ({
    borderColor: active ? themeColors.primary : 'hsl(var(--border))',
    backgroundColor: active ? alpha(themeColors.primary, '15') : 'transparent',
    color: active ? themeColors.primary : undefined,
  })

  const titles = {
    loading: ['Post a trade idea', 'One moment.'],
    error: ['Post a trade idea', 'Your record could not be loaded.'],
    handle: ['Pick a handle and avatar', 'This is how you appear on the feed. The handle cannot be changed later; the avatar can.'],
    form: composer === 'post'
      ? ['Post a team update', 'A plain post from the FreeTradeJournal team. No levels, no outcome. Links are allowed.']
      : ['Post a trade idea', 'Share the setup before you take it. Link the trade afterwards so people can see how it went.'],
  } as const

  return (
    <Dialog open={open} onOpenChange={v => { if (!posting && !claiming) onOpenChange(v) }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <div className="px-6 pt-5 pb-4 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <UsersThree className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
          </div>
          <DialogHeader className="p-0 space-y-0.5 text-left">
            <DialogTitle className="text-base">{titles[step][0]}</DialogTitle>
            <DialogDescription className="text-xs">{titles[step][1]}</DialogDescription>
          </DialogHeader>
        </div>

        {step === 'loading' && (
          <div className="px-6 py-5 space-y-3" role="status" aria-label="Loading your record">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {step === 'error' && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground">We could not check whether you already have a handle. Try again in a moment.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={onRetryProfile} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>Try again</Button>
            </div>
          </div>
        )}

        {step === 'handle' && (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Live preview: an idea card header updating as they type. */}
            <IdeaPreviewCard
              caption="How you will look on the feed"
              preview={{ avatar, handle: cleanHandle, market: 'forex', symbol: 'EURUSD', direction: 'long', entry: 1.1045, stop: 1.1005, target: 1.1125 }}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="idea-handle">Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">@</span>
                <Input
                  id="idea-handle"
                  value={handle}
                  onChange={e => { setHandle(e.target.value.replace(/\s/g, '')); setClaimError(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') void submitHandle() }}
                  placeholder="yourname"
                  maxLength={21}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="h-10 pl-7"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground min-h-[1rem]" aria-live="polite">
                {handleCheck === 'checking' && 'Checking…'}
                {handleCheck === 'free' && <span style={{ color: themeColors.profit }}>Available</span>}
                {handleCheck === 'taken' && <span style={{ color: themeColors.loss }}>Taken</span>}
                {handleCheck === 'unknown' && 'Could not check availability. Try it and we will say if it is taken.'}
                {handleCheck === 'idle' && handle.length > 0 && !handleValid && '3 to 20 letters, numbers or underscores.'}
              </p>
            </div>

            <AvatarPicker value={avatar} onChange={setAvatar} />

            <p className="text-xs text-muted-foreground">
              Your real name and email stay private. Posting needs a verified email address.
            </p>
            {claimError && (
              <p className="text-xs rounded-md border px-3 py-2" role="alert" style={{ color: themeColors.loss, borderColor: alpha(themeColors.loss, '40') }}>
                {claimError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={claiming}>Cancel</Button>
              <Button
                onClick={submitHandle}
                disabled={!canClaim}
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                {claiming ? <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                Use this handle
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && profile && profile !== 'error' && (
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {isDev && (
              <div className="flex gap-1.5" role="group" aria-label="What to post">
                {([['idea', 'Trade idea', Lightbulb], ['post', 'Team update', Megaphone]] as const).map(([value, label, Icon]) => {
                  const active = composer === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { setComposer(value); setPostError(null) }}
                      className="h-9 px-3 rounded-md text-sm font-medium border transition-colors hover:bg-muted/40 inline-flex items-center gap-1.5"
                      style={pill(active)}
                    >
                      <Icon className="h-4 w-4" weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            {composer === 'post' ? (
              <>
                <IdeaPreviewCard
                  caption="Your update as it will appear"
                  preview={{ avatar: profile, handle: profile.handle, market: 'other', symbol: '', direction: 'long', entry: null, stop: null, target: null, post: { title: postTitle.trim() } }}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="update-title">Title (optional)</label>
                  <Input id="update-title" value={postTitle} onChange={e => setPostTitle(e.target.value.slice(0, 120))} placeholder="What is new" className="h-10" maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="update-body">Update</label>
                  <Textarea
                    id="update-body"
                    value={postBody}
                    onChange={e => setPostBody(e.target.value.slice(0, POST_BODY_MAX))}
                    placeholder="Say it plainly. Links are fine here."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right tabular-nums">{postBody.length}/{POST_BODY_MAX}</p>
                </div>
                {renderAttachment('Image (optional)', 'Drop an image or GIF, or browse')}
                {postError && (
                  <p className="text-xs rounded-md border px-3 py-2" role="alert" style={{ color: themeColors.loss, borderColor: alpha(themeColors.loss, '40') }}>
                    {postError}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground min-w-0" aria-live="polite">{updateMissing ?? ''}</p>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={posting}>Cancel</Button>
                    <Button onClick={submitUpdate} disabled={!canPostUpdate} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                      {posting && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      Post update
                    </Button>
                  </div>
                </div>
              </>
            ) : (
            <>
            {/* Live preview of the card as the form fills in. */}
            <IdeaPreviewCard
              caption="Your idea as it will appear"
              preview={{
                avatar: profile,
                handle: profile.handle,
                market,
                symbol: symbol.trim().toUpperCase(),
                direction,
                entry: allNumbers ? entryN : null,
                stop: allNumbers ? stopN : null,
                target: allNumbers ? targetN : null,
              }}
            />

            {/* Market */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground" id="idea-market-label">Market</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="idea-market-label">
                {IDEA_MARKETS.map(m => {
                  const active = market === m
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { if (m !== market) { setMarket(m); setSymbol('') } }}
                      className="h-8 px-3 rounded-md text-xs font-medium border transition-colors hover:bg-muted/40"
                      style={pill(active)}
                    >
                      {IDEA_MARKET_LABELS[m]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Symbol + direction */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5 min-w-0">
                {PICKER_MARKETS.has(market)
                  ? <span className="text-xs font-medium text-muted-foreground">Symbol</span>
                  : <label className="text-xs font-medium text-muted-foreground" htmlFor="idea-symbol">Symbol</label>}
                {PICKER_MARKETS.has(market) ? (
                  <InstrumentCombobox value={symbol} onChange={setSymbol} categories={groups} placeholder="Pick or type a symbol" />
                ) : (
                  <Input
                    id="idea-symbol"
                    value={symbol}
                    onChange={e => setSymbol(e.target.value.toUpperCase())}
                    placeholder={market === 'crypto' ? 'BTCUSD' : market === 'stocks' ? 'AAPL' : 'Symbol'}
                    maxLength={15}
                    autoCapitalize="characters"
                    className="h-10"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground" id="idea-direction-label">Direction</span>
                <div className="flex gap-1.5" role="group" aria-labelledby="idea-direction-label">
                  {(['long', 'short'] as const).map(d => {
                    const active = direction === d
                    const color = d === 'long' ? themeColors.profit : themeColors.loss
                    const Icon = d === 'long' ? TrendUp : TrendDown
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDirection(d)}
                        className="h-10 px-4 rounded-md text-sm font-medium border transition-colors hover:bg-muted/40 inline-flex items-center gap-1.5"
                        style={{
                          borderColor: active ? color : 'hsl(var(--border))',
                          backgroundColor: active ? alpha(color, '15') : 'transparent',
                          color: active ? color : undefined,
                        }}
                      >
                        <Icon className="h-4 w-4" weight={active ? 'bold' : 'regular'} aria-hidden="true" />
                        {d === 'long' ? 'Long' : 'Short'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Levels */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['Entry', entry, setEntry, 'idea-entry'],
                  ['Stop', stop, setStop, 'idea-stop'],
                  ['Target', target, setTarget, 'idea-target'],
                ] as const).map(([label, value, set, id]) => (
                  <div key={id} className="space-y-1.5 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>{label}</label>
                    <Input
                      id={id}
                      value={value}
                      onChange={e => set(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-10 tabular-nums"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs min-h-[1rem]" aria-live="polite" style={levelError ? { color: themeColors.loss } : undefined}>
                {levelError ?? <span className="text-muted-foreground">Entry and stop are needed. Target is optional.</span>}
              </p>
            </div>

            {/* Reasoning */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="idea-reasoning">Why this trade</label>
              <Textarea
                id="idea-reasoning"
                value={reasoning}
                onChange={e => setReasoning(e.target.value.slice(0, REASONING_MAX))}
                placeholder="What you see, where you are wrong, and what you are aiming for."
                rows={4}
                className="resize-none"
              />
              <div className="flex items-start justify-between gap-3 text-xs">
                <p className="min-h-[1rem]" aria-live="polite" style={hasLink ? { color: themeColors.loss } : undefined}>
                  {hasLink
                    ? 'Links and invites are not allowed. Describe the setup instead.'
                    : reasoningShort
                      ? <span className="text-muted-foreground">Say at least a sentence.</span>
                      : ''}
                </p>
                <p className="text-muted-foreground tabular-nums shrink-0">{reasoning.length}/{REASONING_MAX}</p>
              </div>
            </div>

            {/* Chart image or GIF */}
            {renderAttachment('Chart (optional)', 'Drop a chart screenshot or GIF, or browse')}

            <p className="text-xs text-muted-foreground">
              Ideas are public to everyone signed in and are not financial advice. Posting means you accept the{' '}
              <button type="button" onClick={onShowRules} className="underline underline-offset-2 hover:text-foreground">community rules</button>.
              You can post 5 a day.
            </p>

            {postError && (
              <p className="text-xs rounded-md border px-3 py-2" role="alert" style={{ color: themeColors.loss, borderColor: alpha(themeColors.loss, '40') }}>
                {postError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground min-w-0" aria-live="polite">
                {missing.length > 0 && `To post: ${missing.join(', ')}.`}
              </p>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={posting}>Cancel</Button>
                <Button
                  onClick={submit}
                  disabled={!canPost}
                  style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                >
                  {posting && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Post idea
                </Button>
              </div>
            </div>
            </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
