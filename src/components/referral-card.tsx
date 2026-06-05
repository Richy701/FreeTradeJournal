import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Share2, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface ReferralStats {
  referralCount: number;
  referralCode: string;
  rewardThreshold: number;
  referralProExpiresAt: string | null;
  rewardEarned: boolean;
}

export function ReferralCard() {
  const { user, isDemo } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || isDemo) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
        const fns = await getFirebaseFunctions();
        const getStats = httpsCallable(fns, 'getReferralStats');
        const result = await getStats();
        if (!cancelled) setStats(result.data as ReferralStats);
      } catch {
        if (!cancelled) setStats({ referralCount: 0, referralCode: user.uid, rewardThreshold: 5, referralProExpiresAt: null, rewardEarned: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isDemo]);

  const referralLink = stats
    ? `https://www.freetradejournal.com/signup?ref=${stats.referralCode}`
    : '';

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied');
      trackEvent('referral_link_copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FreeTradeJournal',
          text: 'I use FreeTradeJournal to track my trades. Try it free:',
          url: referralLink,
        });
        trackEvent('referral_link_shared');
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }, [referralLink, handleCopy]);

  if (!user || isDemo || loading) return null;

  const count = stats?.referralCount || 0;
  const threshold = stats?.rewardThreshold || 5;
  const remaining = Math.max(0, threshold - count);
  const progress = Math.min(count / threshold, 1);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Invite Friends</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {stats?.rewardEarned
            ? 'You earned 14 days of Pro. Keep sharing to help fellow traders.'
            : `Refer ${threshold} friends, get 14 days of Pro free.`
          }
        </p>
      </div>

      {/* Progress toward reward */}
      {stats?.rewardEarned ? (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/20">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-amber-500">14 days of Pro earned</span>
            {stats.referralProExpiresAt && (
              <p className="text-xs text-muted-foreground">
                Expires {new Date(stats.referralProExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{count} referred</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{count} / {threshold} friends</span>
            </span>
            <span className="text-muted-foreground">
              {remaining} more for free Pro
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, backgroundColor: '#f59e0b' }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground truncate font-mono">
          {referralLink}
        </div>
        <Button variant="outline" size="sm" className="shrink-0 h-9 gap-1.5" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button variant="outline" size="sm" className="shrink-0 h-9 gap-1.5" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
