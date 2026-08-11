import type { CSSProperties, ReactNode } from 'react';
import { Brain, Gauge, ChartPie, BookOpen } from '@phosphor-icons/react';
import { SEOMeta } from '@/components/seo-meta';

const features = [
  { icon: ChartPie, title: 'Performance Analytics', desc: 'See your P&L, win rate, and equity curve' },
  { icon: Brain, title: 'AI Trade Coaching', desc: 'Ask the coach about your own trades' },
  { icon: BookOpen, title: 'Trading Journal', desc: 'Write down the setup, how you felt, and what you learned' },
  { icon: Gauge, title: 'Risk Management', desc: 'Set your rules and see how often you stick to them' },
];

// The panel is deliberately dark in both themes — it mirrors the dark
// dashboard the user is signing in to, with amber kept as the accent.
const glowLayer: CSSProperties = {
  backgroundImage:
    'radial-gradient(ellipse 90% 55% at 15% -10%, rgba(245,158,11,0.28), transparent 62%), ' +
    'radial-gradient(ellipse 70% 45% at 110% 115%, rgba(245,158,11,0.14), transparent 60%)',
};

interface AuthLayoutProps {
  panelTitle: ReactNode;
  panelSubtitle: string;
  mobileTitle: ReactNode;
  mobileSubtitle: string;
  showFeatures?: boolean;
  children: ReactNode;
}

export function AuthLayout({ panelTitle, panelSubtitle, mobileTitle, mobileSubtitle, showFeatures = false, children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 safe-top safe-bottom">
      <SEOMeta />
      <div className="w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-card">

        {/* Left Panel - Branding (desktop only) */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden bg-zinc-950">
          <div aria-hidden className="absolute inset-0" style={glowLayer} />

          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="FTJ" className="h-10 w-10 rounded-xl flex-shrink-0" />
              <span className="font-display text-xl font-bold text-white">FreeTradeJournal</span>
            </div>
            <div className="space-y-3 mt-10">
              <h2 className="font-display text-[2.5rem] font-bold text-white leading-[1.1] tracking-tight">{panelTitle}</h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">{panelSubtitle}</p>
            </div>
          </div>

          {showFeatures && (
            <div className="relative space-y-5 my-8">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/20 shrink-0">
                      <FeatureIcon className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{feature.title}</p>
                      <p className="text-xs text-white/50">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative pt-6 border-t border-white/10">
            <p className="text-white/80 text-sm font-medium">Free forever. No credit card required.</p>
            <p className="text-white/40 text-xs mt-1">Over 2,000 traders keep their journal here.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          {/* Mobile-only branded header */}
          <div className="lg:hidden -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 px-6 py-6 sm:px-8 sm:py-8 relative overflow-hidden bg-zinc-950 rounded-t-2xl">
            <div aria-hidden className="absolute inset-0" style={glowLayer} />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/favicon.svg" alt="FTJ" className="h-9 w-9 rounded-xl flex-shrink-0" />
                <span className="font-display text-lg font-bold text-white">FreeTradeJournal</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white leading-tight">{mobileTitle}</h1>
              <p className="text-white/60 text-sm mt-1">{mobileSubtitle}</p>
            </div>
          </div>

          {children}
        </div>

      </div>
    </div>
  );
}

// Amber gradient accent for the last word(s) of a panel headline.
export function PanelAccent({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}
