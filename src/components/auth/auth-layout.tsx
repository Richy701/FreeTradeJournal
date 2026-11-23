import type { ReactNode } from 'react';
import { Brain, Gauge, ChartPie, BookOpen } from '@phosphor-icons/react';
import { SEOMeta } from '@/components/seo-meta';
import { MarketingHeader } from '@/components/marketing-header';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';

const features = [
  { icon: ChartPie, title: 'Performance Analytics', desc: 'See your P&L, win rate, and equity curve' },
  { icon: Brain, title: 'AI Trade Coaching', desc: 'Ask the coach about your own trades' },
  { icon: BookOpen, title: 'Trading Journal', desc: 'Write down the setup, how you felt, and what you learned' },
  { icon: Gauge, title: 'Risk Management', desc: 'Set your rules and see how often you stick to them' },
];

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
    <div className="min-h-dvh bg-background safe-bottom">
      <SEOMeta />
      <MarketingHeader />
      <main className="relative overflow-hidden px-5 py-10 sm:px-8 sm:py-16">
        <GeometricBackdrop />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="hidden min-w-0 space-y-8 lg:block lg:pt-8">
            <div className="space-y-4">
              <h2 className="font-display text-4xl font-semibold leading-[1.12] tracking-tight">{panelTitle}</h2>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">{panelSubtitle}</p>
            </div>
            {showFeatures && <div className="space-y-5 border-y py-6">
              {features.map(feature => {
                const Icon = feature.icon;
                return <div key={feature.title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div><p className="text-sm font-medium">{feature.title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p></div>
                </div>;
              })}
            </div>}
            <div className="text-sm leading-relaxed text-muted-foreground"><p>Free forever. No credit card required.</p><p className="mt-1">Over 4,000 traders keep their journal here.</p></div>
          </div>
          <div className="min-w-0 rounded-xl border bg-card p-5 sm:p-8 [overflow-wrap:anywhere]">
            <div className="mb-6 border-b pb-5 lg:hidden">
              <h1 className="text-lg font-semibold tracking-tight">{mobileTitle}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mobileSubtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function PanelAccent({ children }: { children: ReactNode }) {
  return <span className="text-amber-600 dark:text-amber-400">{children}</span>;
}
