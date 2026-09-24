import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ClosingCta } from '@/components/closing-cta';
import { lazy, Suspense } from 'react';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { READING_MEASURE } from '@/components/reading-page';

// One page per prop firm, driven entirely by src/data/firm-pages.json.
// Adding a firm = adding one JSON entry; routes, meta, prerender, and the
// sitemap all derive from that file. Rule values in the JSON are verified
// against the firm's official site — each entry carries its rulesVerified
// date; re-verify before editing numbers.
export interface FirmPage {
  slug: string;
  name: string;
  logo: string;
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
  guides?: string[]; // blog slugs shown above the FAQ
}

// Lazy so the post markdown stays out of this page's chunk.
const BlogStrip = lazy(() => import('@/components/blog-strip').then((m) => ({ default: m.BlogStrip })));

export default function FirmJournalPage({ page }: { page: FirmPage }) {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1={page.heroTitle1}
          title2={page.heroTitle2}
          subtitle={page.heroSubtitle}
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Why a journal</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Tracking a {page.name}<br />
                <span className="text-amber-500">account.</span>
              </h2>
            </div>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:items-start">
              <div className={`${READING_MEASURE} space-y-4 text-muted-foreground leading-relaxed`}>
                {page.intro.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <FirmAtAGlance page={page} />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-6xl">
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
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How FreeTradeJournal helps</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Every rule,<br />
                <span className="text-amber-500">tracked for you.</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 lg:gap-x-16 [&>*]:border-b [&>*]:border-border/40">
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
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Getting your trades in</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Import from<br />
                <span className="text-amber-500">{page.importPlatform}.</span>
              </h2>
            </div>

            <div className="text-muted-foreground leading-relaxed mb-8">
              <p>{page.importIntro}</p>
            </div>

            {/* Two columns on desktop; the numbers carry the reading order (across, then down). */}
            <div className="grid lg:grid-cols-2 lg:gap-x-16 [&>*]:border-b [&>*]:border-border/40">
              {page.importSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 min-w-0">{step}</p>
                </div>
              ))}
            </div>

            <ClosingCta
              title={`Track your ${page.name} account free`}
              subtitle="No credit card. Import your trades and see your stats in minutes."
              primary={{ label: 'Start free', to: '/signup' }}
              secondary={page.affiliate ? { label: page.affiliate.label, href: page.affiliate.url } : undefined}
              related={page.related}
            />
          </div>
        </section>

        {page.guides && page.guides.length > 0 && (
          <Suspense fallback={<div className="min-h-[32rem]" aria-hidden="true" />}>
            <BlogStrip
              slugs={page.guides}
              eyebrow="Guides"
              title={<>Reading for <span className="text-amber-600 dark:text-amber-500">{page.name} traders</span></>}
              subtitle="Import walkthroughs and evaluation habits from the blog, written by the person who builds the journal."
            />
          </Suspense>
        )}

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

// The headline numbers beside the intro, taken from the same verified rules
// as the full table below. Picks one row per topic by label, since firms name
// their rules differently (FTMO "Maximum loss", Apex "Trailing drawdown").
const GLANCE_TOPICS = [/account sizes?/i, /target/i, /daily loss/i, /maximum loss|max loss|trailing drawdown/i, /profit split|payout split/i];

function FirmAtAGlance({ page }: { page: FirmPage }) {
  const rows = GLANCE_TOPICS
    .map((topic) => page.rules.find((rule) => topic.test(rule.label)))
    .filter((rule): rule is FirmPage['rules'][number] => Boolean(rule));

  return (
    <Card>
      <CardHeader className="border-b border-border/50">
        {/* Official white-on-transparent logo: dark panel in light mode so it stays visible. */}
        <div className="inline-flex self-start items-center rounded-xl bg-zinc-950 dark:bg-transparent px-4 py-3 dark:p-0">
          <img src={page.logo} alt={`${page.name} logo`} className="h-9 w-auto max-w-[200px] object-contain" />
        </div>
        <p className="pt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{page.name} at a glance</p>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        <dl className="space-y-4">
          {rows.map((rule) => (
            <div key={rule.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rule.label}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-foreground">{rule.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-muted-foreground">
          Rules verified {new Date(`${page.rulesVerified}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}. Full table below.
        </p>
      </CardContent>
    </Card>
  );
}
