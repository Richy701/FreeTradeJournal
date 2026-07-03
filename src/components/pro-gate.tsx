import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkle } from '@phosphor-icons/react';
import { useProStatus } from '@/contexts/pro-context';
import { useAuth } from '@/contexts/auth-context';
import { trackEvent } from '@/lib/analytics';

interface ProGateProps {
  children: ReactNode;
  featureName: string;
  featureDescription?: string;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'Coach FTJ': 'Get personalised coaching tips based on your actual trade history.',
  'AI Trade Analysis': 'Spot patterns in your wins and losses with AI-powered pattern detection.',
  'AI Trade Review': 'Get entry/exit quality scores and improvement suggestions on every trade.',
  'AI Journal Prompts': 'Reflect deeper with prompts generated from your recent trading behaviour.',
  'AI Strategy Tagger': 'Auto-classify trades by strategy so you know what\'s actually working.',
  'AI Risk Alerts': 'Catch revenge trading, loss streaks, and overexposure before they hurt.',
  'AI Goal Coach': 'Turn your trading goals into an actionable improvement plan.',
  'PDF Report': 'Export a professional performance report to share or review offline.',
};

const isAIFeature = (name: string) => name.startsWith('AI ') || name === 'Coach FTJ';

export function ProGate({ children, featureName, featureDescription }: ProGateProps) {
  const { isPro, isLoading, hasAIAccess, freeAiQuota } = useProStatus();
  const { isDemo } = useAuth();

  // Locked wall = not pro, and not in the free-AI-allowance teaser branch below.
  const quotaExceeded = isAIFeature(featureName) && !!freeAiQuota && freeAiQuota.remaining === 0;
  const showsWall = !isLoading && !isPro && !(isAIFeature(featureName) && hasAIAccess && freeAiQuota);
  useEffect(() => {
    if (showsWall) {
      trackEvent('pro_gate_shown', { feature: featureName, quotaExceeded });
    }
  }, [showsWall, featureName, quotaExceeded]);

  if (isLoading) {
    return null;
  }

  // Demo showcases AI features working with sample data, so don't wall them.
  // Non-AI Pro features stay gated so the demo still shows the free experience.
  if (isDemo && isAIFeature(featureName)) {
    return <>{children}</>;
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (isAIFeature(featureName) && hasAIAccess && freeAiQuota) {
    return (
      <div className="relative">
        {children}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-amber-600 dark:text-amber-400">{freeAiQuota.remaining}</span> of {freeAiQuota.limit} free AI queries remaining this month
          </p>
          <Link
            to="/pricing"
            onClick={() => trackEvent('free_tier_upgrade_cta', { feature: featureName, remaining: freeAiQuota.remaining })}
            className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            Get unlimited
          </Link>
        </div>
      </div>
    );
  }

  const description = featureDescription ?? FEATURE_DESCRIPTIONS[featureName] ?? 'Unlock AI coaching, trade analysis & smart risk alerts.';

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-lg">
        <div className="flex flex-col items-center gap-3 text-center p-6 max-w-xs">
          <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">{featureName} — Pro</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
          {isAIFeature(featureName) && freeAiQuota && freeAiQuota.remaining === 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                You've used all {freeAiQuota.limit} free AI queries this month.
              </p>
              <Link
                to="/pricing"
                onClick={() => trackEvent('pro_gate_cta_clicked', { feature: featureName })}
                className="mt-1 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-150 shadow-sm"
              >
                <Sparkle className="h-3.5 w-3.5" />
                Get Unlimited AI
              </Link>
              <p className="text-[10px] text-muted-foreground">Resets next month, or upgrade for unlimited</p>
            </>
          ) : (
            <>
              <Link
                to="/pricing"
                onClick={() => trackEvent('pro_gate_cta_clicked', { feature: featureName })}
                className="mt-1 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-150 shadow-sm"
              >
                <Sparkle className="h-3.5 w-3.5" />
                View Pro Plans
              </Link>
              <p className="text-[10px] text-muted-foreground">From $12.99/mo · Cancel anytime</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
