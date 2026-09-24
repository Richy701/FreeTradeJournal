import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { MarketingHeader } from '@/components/marketing-header';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { SEOMeta } from '@/components/seo-meta';
import { JsonLd } from '@/components/json-ld';
import { PRICING_PLANS } from '@/constants/pricing';

const price = (name: string) => `$${PRICING_PLANS.find((plan) => plan.name === name)?.price.toFixed(2)}`;

// Who is behind the product, in the same voice as the blog. Every claim here
// is one Richy confirmed on 2026-09-24 (started building in 2025); do not add
// background he has not.
export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEOMeta />
      <JsonLd
        id="about-jsonld"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'AboutPage',
              '@id': 'https://www.freetradejournal.com/about',
              url: 'https://www.freetradejournal.com/about',
              name: 'About FreeTradeJournal',
              about: { '@id': 'https://www.freetradejournal.com/#organization' },
              mainEntity: { '@id': 'https://www.freetradejournal.com/about#richy' },
            },
            {
              '@type': 'Person',
              '@id': 'https://www.freetradejournal.com/about#richy',
              name: 'Richy',
              url: 'https://www.freetradejournal.com/about',
              jobTitle: 'Founder',
              worksFor: { '@id': 'https://www.freetradejournal.com/#organization' },
              nationality: 'GB',
              knowsAbout: ['trading journals', 'prop firm evaluations', 'futures trading', 'forex trading'],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freetradejournal.com/' },
                { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.freetradejournal.com/about' },
              ],
            },
          ],
        }}
      />
      <MarketingHeader />

      <section className="relative overflow-hidden bg-background noise-overlay">
        <GeometricBackdrop />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-10 sm:pt-40 sm:pb-12">
          <div className="max-w-[44rem] mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">About</p>
            <h1 className="font-display text-3xl sm:text-[2.5rem] sm:leading-[1.15] font-bold tracking-tight">
              One trader, one journal, <span className="text-amber-500">no second subscription</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground leading-relaxed">
              FreeTradeJournal is built and run by one person. This page says who, why, and how the free plan stays free.
            </p>
          </div>
        </div>
      </section>

      <article className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-16">
        <div className="max-w-[44rem] mx-auto space-y-10 text-lg leading-[1.8] text-foreground/85">
          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-4">Who builds this</h2>
            <p>
              I am Richy. I trade from the UK, and I have been building FreeTradeJournal on my own since 2025. There is no team behind the support inbox. When you email, you get me.
            </p>
            <p className="mt-5">
              Before this I was paying for Topstep combines and failing a few of them. The thing that finally helped was not a new strategy. It was writing every trade down and looking at the numbers by day and by session, which is a tedious thing to do in a spreadsheet and an expensive thing to do in the journals that existed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-4">Why it exists</h2>
            <p>
              I tried TradeZella. It was fine. It was not free, and the parts I needed were behind a paywall while I was already paying an evaluation fee. Paying a second subscription just to record what happened felt wrong, so I built my own and put it online.
            </p>
            <p className="mt-5">
              More than 5,000 traders have signed up since. Most of them are on the free plan, which is the point. The people who leave reviews are real users and their words are their own. You can read them on the <Link to="/" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">homepage</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-4">What it is, and what it is not</h2>
            <p>
              It is a place to log trades, import them from your broker, write about your sessions, and see what your own data says. The AI coach reads your trades and your journal and tells you what is in them. It does not predict markets, it does not send signals, and it has no opinion on where anything is going.
            </p>
            <p className="mt-5">
              It is built for the way I trade: prop firm evaluations, futures and forex, files from Tradovate, NinjaTrader and MetaTrader. If you trade US stocks or options there are journals with more depth for that, and the <Link to="/blog/best-free-trading-journals-2026" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">comparison post</Link> names them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-4">How the free plan stays free</h2>
            <p>
              Pro subscriptions pay for it. Pro is {price('Monthly')} a month or {price('Yearly')} a year, and it removes the free plan's limits on analytics history, journal entries and accounts. There are no ads, and the free plan has no time limit and needs no card. See the <Link to="/pricing" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">pricing page</Link> for the full list.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-4">Get in touch</h2>
            <p>
              Bug reports, feature requests and blunt feedback all go to <a href="mailto:support@freetradejournal.com" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">support@freetradejournal.com</a>. Most of what shipped this year started as an email from a user. The <Link to="/changelog" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">changelog</Link> shows what changed and when.
            </p>
          </section>

          <div className="border-t pt-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-600 transition-colors"
            >
              Start journaling free
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>

      <Footer7 {...footerConfig} />
    </div>
  );
}
