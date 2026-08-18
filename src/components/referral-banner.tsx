import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, ShareNetwork, Gift } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { NoticeBanner } from '@/components/notice-banner'
import { useAuth } from '@/contexts/auth-context'
import { useProStatus } from '@/contexts/pro-context'
import { useUserStorage } from '@/utils/user-storage'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'

// uid-suffixed: a shared browser must not hide the banner for every account
const dismissKeyFor = (uid: string | undefined) => `ftj-dismiss-referral-banner-${uid || 'anon'}`

// A user who hasn't logged real trades yet has no basis to recommend the app,
// and their first sessions should stay focused on activation
const MIN_TRADES_TO_SHOW = 5

interface ReferralStats {
  referralCount: number
  referralCode: string
  rewardThreshold: number
  referralProExpiresAt: string | null
  rewardEarned: boolean
}

export function ReferralBanner() {
  const { user, isDemo } = useAuth()
  // The reward is 14 days of Pro, which is worth nothing to someone already
  // paying for it and worse than nothing to a lifetime owner. `rewardEarned`
  // doesn't cover this: it only flips for Pro earned *through* referrals, not
  // Pro that was bought. Trial users still see it — extra days are real value.
  const { isPro, trialEndsAt } = useProStatus()
  const isPayingPro = isPro && !trialEndsAt
  const userStorage = useUserStorage()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(dismissKeyFor(user?.uid)) ?? localStorage.getItem('ftj-dismiss-referral-banner')
    if (!dismissedAt) return false
    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
    if (daysSince > 7) {
      localStorage.removeItem(dismissKeyFor(user?.uid))
      return false
    }
    return true
  })
  const [loading, setLoading] = useState(true)

  const tradeCount = (() => {
    try {
      const parsed = JSON.parse(userStorage.getItem('trades') ?? '[]')
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  })()
  const activated = tradeCount >= MIN_TRADES_TO_SHOW

  useEffect(() => {
    if (!user || isDemo || dismissed || !activated || isPayingPro) return
    let cancelled = false
    ;(async () => {
      try {
        const { httpsCallable } = await import('firebase/functions')
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy')
        const fns = await getFirebaseFunctions()
        const getStats = httpsCallable(fns, 'getReferralStats')
        const result = await getStats()
        if (!cancelled) setStats(result.data as ReferralStats)
      } catch {
        if (!cancelled) setStats({ referralCount: 0, referralCode: user.uid, rewardThreshold: 3, referralProExpiresAt: null, rewardEarned: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, isDemo, dismissed, activated, isPayingPro])

  const referralLink = stats
    ? `https://www.freetradejournal.com/signup?ref=${stats.referralCode}`
    : ''

  const handleCopy = useCallback(async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied')
      trackEvent('referral_link_copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }, [referralLink])

  const handleShare = useCallback(async () => {
    if (!referralLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FreeTradeJournal',
          text: 'I use FreeTradeJournal to track my trades and improve my edge. Try it free:',
          url: referralLink,
        })
        trackEvent('referral_link_shared')
      } catch { /* user cancelled */ }
    } else {
      handleCopy()
    }
  }, [referralLink, handleCopy])

  const handleDismiss = () => {
    localStorage.setItem(dismissKeyFor(user?.uid), String(Date.now()))
    setDismissed(true)
  }

  if (!user || isDemo || dismissed || !activated || isPayingPro || loading || !stats) return null
  if (stats.rewardEarned) return null

  const count = stats.referralCount
  const threshold = stats.rewardThreshold || 3
  const remaining = Math.max(0, threshold - count)

  return (
    <NoticeBanner
      className="mx-4 mb-4"
      tone="info"
      icon={Gift}
      title={count > 0
        ? `${count} of ${threshold} friends referred, ${remaining} more for free Pro`
        : `Invite ${threshold} friends, earn free Pro`}
      description="Friends sign up with your link and log a trade"
      actions={
        <>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ShareNetwork className="h-3.5 w-3.5" />
              Share
            </Button>
          )}
          <Button size="sm" className="shadow-none" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </>
      }
      onDismiss={handleDismiss}
    />
  )
}
