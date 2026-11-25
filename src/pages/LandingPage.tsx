import { lazy, Suspense } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, ArrowDown } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';
import { BlackFridayLandingPill } from '@/components/black-friday-landing-pill';
import { isBlackFriday } from '@/constants/pricing';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { ProductTour } from '@/components/blocks/product-tour';
import { LandingProductExplorer } from '@/components/blocks/landing-product-explorer';
import { MarketingHeader } from '@/components/marketing-header';
import { FAQSection } from '@/components/blocks/faq-section';
import { TestimonialsSection } from '@/components/blocks/testimonials-section';
import { LogoCloud } from '@/components/blocks/logo-cloud';
import { SEOMeta } from '@/components/seo-meta';
import { Button } from '@/components/ui/button';

const BlogStrip = lazy(() => import('@/components/blog-strip').then(m => ({ default: m.BlogStrip })));

export default function LandingPage() {
  const { user, loading, hadSession, enterDemoMode } = useAuth();
  const navigate = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;
  if (loading && hadSession) return <div className="min-h-screen bg-background" aria-busy="true" />;
  const openDemo = () => { enterDemoMode(); navigate('/dashboard'); };

  return <div className="w-full">
    <SEOMeta />
    <MarketingHeader overlay />

    <main>
      <section className="relative flex w-full items-center overflow-hidden bg-background noise-overlay pb-12 pt-28 sm:pb-16 sm:pt-32">
        <GeometricBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 sm:px-8">
          {isBlackFriday() && <div className="mb-8"><BlackFridayLandingPill /></div>}
          <div className="grid min-w-0 grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <h1 className="max-w-4xl font-display text-[clamp(2.25rem,4.5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.035em]">Every trade tells<br />you something.<br /><span className="text-amber-600 dark:text-amber-400">Keep the lesson.</span></h1>
            </div>
            <div className="min-w-0 max-w-lg pb-1 lg:pb-3">
              <p className="text-base leading-relaxed text-muted-foreground">Your trades, your decisions, your progress. A free trading journal that brings the numbers and the notes together.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="h-auto min-h-11 max-w-full whitespace-normal bg-amber-400 px-5 text-sm font-semibold text-black hover:bg-amber-300"><Link to="/signup">Start your journal<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button variant="outline" onClick={openDemo} className="h-auto min-h-11 max-w-full whitespace-normal gap-2 px-5"><Play className="h-4 w-4" />View Live Demo</Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Free plan available. No card needed to get started.</p>
              <a href="#product-preview" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">Take a look inside<ArrowDown className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="product-preview" aria-label="Product preview" className="scroll-mt-6 px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-[1600px]">
          <ProductTour />
        </div>
      </section>
      <LogoCloud />

      <section className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">A useful habit.<br /><span className="text-muted-foreground">Not another spreadsheet.</span></h2>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground lg:justify-self-end lg:pt-2">You don’t need a perfect trading history to start. Record what happened, understand the decision, and take one useful lesson into the next session.</p>
        </div>
        <ol className="grid gap-8 border-y py-8 md:grid-cols-3 md:gap-10">
          {[
            ['Record', 'Bring the details together.', 'Add a trade manually or import your broker history. Include costs so you can review the net result.'],
            ['Review', 'Put the outcome in context.', 'Compare your results with your notes, screenshots, and the rules you meant to follow.'],
            ['Refine', 'Choose what to work on next.', 'Use your history to set a goal, revisit a pattern, or ask a more specific question.'],
          ].map(([label, title, copy], i) => <li key={label}>
            <div className="mb-5 flex items-center gap-3"><span className="font-mono text-xs text-amber-600 dark:text-amber-400">0{i + 1}</span><span className="text-sm font-medium">{label}</span></div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">{title}</h3><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{copy}</p>
          </li>)}
        </ol>
      </section>

      <LandingProductExplorer />
      <TestimonialsSection compact />
      <FAQSection compact />
      <Suspense fallback={<div className="min-h-[32rem]" aria-hidden="true" />}>
        <BlogStrip compact editorial title={<>Build a better review habit.</>} subtitle="Practical guides to broker imports, prop accounts, and keeping a journal you actually use." />
      </Suspense>
      <section className="mx-auto grid max-w-[1600px] gap-5 px-5 pb-16 pt-4 sm:px-8 sm:pb-20 lg:grid-cols-2">
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">Start with your<br className="hidden lg:block" /> next trade.</h2>
        <div className="max-w-lg lg:justify-self-end lg:pt-2">
          <p className="text-base leading-relaxed text-muted-foreground">Free plan, no card. Import from MT4/MT5, Tradovate, NinjaTrader or DAS, or add trades by hand.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild className="h-auto min-h-11 max-w-full whitespace-normal bg-amber-400 px-5 text-black hover:bg-amber-300"><Link to="/signup">Create a free account<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <button type="button" onClick={openDemo} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">or try the demo</button>
          </div>
        </div>
      </section>
    </main>
    <Footer7 {...footerConfig} />
  </div>;
}
