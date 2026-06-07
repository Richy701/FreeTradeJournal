import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, ShareNetwork, Users, X, Gift } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useThemePresets } from '@/contexts/theme-presets'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'

const DISMISS_KEY = 'ftj-dismiss-referral-banner'

interface ReferralStats {
  referralCount: number
  referralCode: string
  rewardThreshold: number
  referralProExpiresAt: string | null
  rewardEarned: boolean
}

export function ReferralBanner() {
  const { user, isDemo } = useAuth()
  const { themeColors, alpha } = useThemePresets()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (!dismissedAt) return false
    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
    if (daysSince > 7) {
      localStorage.removeItem(DISMISS_KEY)
      return false
    }
    return true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || isDemo || dismissed) return
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
  }, [user, isDemo, dismissed])

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
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  if (!user || isDemo || dismissed || loading || !stats) return null
  if (stats.rewardEarned) return null

  const count = stats.referralCount
  const threshold = 3
  const remaining = Math.max(0, threshold - count)
  const progress = Math.min(count / threshold, 1)

  return (
    <div
      className="mx-4 mb-4 rounded-xl border overflow-hidden"
      style={{ borderColor: alpha(themeColors.primary, '25') }}
    >
      <div className="px-4 sm:px-5 py-4 sm:py-5" style={{ backgroundColor: alpha(themeColors.primary, '05') }}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: alpha(themeColors.primary, '15') }}
          >
            <Gift className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: themeColors.primary }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                  Invite friends, earn 14 days of Pro free
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Share your link with {remaining} more friend{remaining !== 1 ? 's' : ''} who sign up and log a trade.
                  You'll unlock AI coaching, cloud sync, and all Pro features.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1 -mt-1 -mr-1 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress */}
            {count > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{count} / {threshold} friends referred</span>
                  </span>
                  <span className="text-muted-foreground">{remaining} more to go</span>
                </div>
                <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%`, backgroundColor: themeColors.primary }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
              <div className="flex-1 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground truncate font-mono">
                {referralLink}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className="gap-1.5 h-9 text-white"
                  style={{ backgroundColor: themeColors.primary }}
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={handleShare}>
                    <ShareNetwork className="h-3.5 w-3.5" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
