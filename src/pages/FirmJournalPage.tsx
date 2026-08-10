import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, ArrowSquareOut } from '@phosphor-icons/react';

// One page per prop firm, driven entirely by src/data/firm-pages.json.
// Adding a firm = adding one JSON entry; routes, meta, prerender, and the
// sitemap all derive from that file. Rule values in the JSON are verified
// against the firm's official site — each entry carries its rulesVerified
// date; re-verify before editing numbers.
export interface FirmPage {
  slug: string;
  name: string;
  title: string;
  description: string;
  keywords: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  intro: string[];
  rulesVerified: string;
  rulesNote: string;
  rules: { label: string; value: string }[];
  tracking: { title: string; desc: string }[];
  importPlatform: string;
  importIntro: string;
  importSteps: string[];
  faqs: { question: string; answer: string }[];
  affiliate?: { label: string; url: string } | null;
  related: { label: string; to: string }[];
}

export default function FirmJournalPage({ page }: { page: FirmPage }) {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">FreeTradeJournal</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base hidden sm:block">Pricing</Link>
              <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base">Sign In</Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <HeroGeometric
          title1={page.heroTitle1}
          title2={page.heroTitle2}
          subtitle={page.heroSubtitle}
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Why a journal</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Tracking a {page.name}<br />
                <span className="text-amber-500">account.</span>
              </h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              {page.intro.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The rules</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                What {page.name}<br />
                <span className="text-amber-500">makes you track.</span>
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/40">
                  {page.rules.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 font-medium text-foreground min-w-[10rem]">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{page.rulesNote}</p>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How FreeTradeJournal helps</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Every rule,<br />
                <span className="text-amber-500">tracked for you.</span>
              </h2>
            </div>

            <div className="divide-y divide-border/40">
              {page.tracking.map((item, i) => (
                <div key={i} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-emerald-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Getting your trades in</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Import from<br />
                <span className="text-amber-500">{page.importPlatform}.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-8">
              <p>{page.importIntro}</p>
            </div>

            <div className="divide-y divide-border/40">
              {page.importSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-6 py-4">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 min-w-0">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-500">Track your {page.name} account free</p>
                <p className="text-xs text-muted-foreground mt-0.5">No credit card. Import your trades and see your stats in minutes.</p>
              </div>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {page.affiliate && (
                <a href={page.affiliate.url} target="_blank" rel="noopener noreferrer sponsored">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                    {page.affiliate.label}
                    <ArrowSquareOut className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {page.related.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                    {link.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FAQSection
          faqs={page.faqs}
          title={`Tracking ${page.name} with FreeTradeJournal`}
          subtitle="Common questions about the rules, the import, and what the journal does"
          id={`faq-structured-data-${page.slug}`}
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
