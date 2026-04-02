import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { useProStatus } from '@/contexts/pro-context';

interface ProGateProps {
  children: ReactNode;
  featureName: string;
  featureDescription?: string;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'AI Trading Coach': 'Get personalised coaching tips based on your actual trade history.',
  'AI Trade Analysis': 'Spot patterns in your wins and losses with AI-powered pattern detection.',
  'AI Trade Review': 'Get entry/exit quality scores and improvement suggestions on every trade.',
  'AI Journal Prompts': 'Reflect deeper with prompts generated from your recent trading behaviour.',
  'AI Strategy Tagger': 'Auto-classify trades by strategy so you know what\'s actually working.',
  'AI Risk Alerts': 'Catch revenge trading, loss streaks, and overexposure before they hurt.',
  'AI Goal Coach': 'Turn your trading goals into an actionable improvement plan.',
  'PDF Report': 'Export a professional performance report to share or review offline.',
};

export function ProGate({ children, featureName, featureDescription }: ProGateProps) {
  const { isPro, isLoading } = useProStatus();

  // Hide content entirely while loading to prevent flash of unblurred content
  if (isLoading) {
    return null;
  }

  if (isPro) {
    return <>{children}</>;
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
          <Link
            to="/pricing"
            className="mt-1 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-150 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            View Pro Plans
          </Link>
          <p className="text-[10px] text-muted-foreground/60">From $5.99/mo · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
