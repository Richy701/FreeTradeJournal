import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { MarketingHeader } from '@/components/marketing-header';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { SEOMeta } from '@/components/seo-meta';
import { JsonLd } from '@/components/json-ld';
import { cn } from '@/lib/utils';
import { posts, categories, type BlogPost } from '@/lib/blog';

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function PostMeta({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
      {featured && (
        <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Featured
        </span>
      )}
      <span className="text-foreground/80">{post.category}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min read</span>
    </div>
  );
}

const ALL = 'All';

export default function Blog() {
  const [category, setCategory] = useState<string>(ALL);
  const visible = category === ALL ? posts : posts.filter((p) => p.category === category);
  // The newest post is featured on the unfiltered view only; a filtered list
  // of one or two posts reads better as a plain grid.
  const featured = category === ALL ? visible[0] : undefined;
  const rest = featured ? visible.slice(1) : visible;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        id="blog-index-jsonld"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Blog',
              '@id': 'https://www.freetradejournal.com/blog#blog',
              url: 'https://www.freetradejournal.com/blog',
              name: 'FreeTradeJournal Blog',
              description:
                'Guides on prop firm evaluations, importing trades from your broker, and getting something useful out of your own journal.',
              publisher: { '@type': 'Organization', name: 'FreeTradeJournal', url: 'https://www.freetradejournal.com' },
              inLanguage: 'en',
              blogPost: posts.map((p) => ({
                '@type': 'BlogPosting',
                '@id': `https://www.freetradejournal.com/blog/${p.slug}#article`,
                url: `https://www.freetradejournal.com/blog/${p.slug}`,
                headline: p.title,
                description: p.subtitle || p.title,
                image: p.coverImage,
                datePublished: p.date,
                dateModified: p.updated || p.date,
                articleSection: p.category,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freetradejournal.com/' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.freetradejournal.com/blog' },
              ],
            },
          ],
        }}
      />
      <SEOMeta
        title="Trading Blog: Prop Firm, Import and Journaling Guides"
        description="Guides on prop firm evaluations, importing trades from your broker, and getting something useful out of your own journal. Written by the person who builds it."
        keywords="trading blog, prop firm blog, topstep guide, trading journal tips, funded trader blog"
      />
      <MarketingHeader />

      {/* Masthead: the landing page's backdrop, full bleed */}
      <section className="relative overflow-hidden bg-background noise-overlay">
        <GeometricBackdrop />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Blog</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Notes from building a <span className="text-amber-500">trading journal</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Guides on prop firm evaluations, importing trades from your broker, and getting something
              useful out of your own data. Written by the person who builds FreeTradeJournal, so expect
              opinions.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Category filter */}
        <div className="mb-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter posts by topic">
          {[ALL, ...categories].map((c) => {
            const count = c === ALL ? posts.length : posts.filter((p) => p.category === c).length;
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20',
                )}
              >
                {c}
                <span className={cn('text-xs', active ? 'text-amber-600/70 dark:text-amber-400/70' : 'text-muted-foreground/70')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Featured post */}
        {featured && (
          <motion.div
            key={featured.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid gap-0 lg:grid-cols-[3fr_2fr] rounded-3xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/30"
            >
              {featured.coverSrc && (
                <div className="overflow-hidden lg:order-2 border-b lg:border-b-0 lg:border-l">
                  <img
                    src={featured.coverSrc}
                    alt=""
                    className="h-full w-full object-cover object-left-top aspect-video lg:aspect-auto transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-10 lg:order-1">
                <PostMeta post={featured} featured />
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight group-hover:text-amber-500 transition-colors">
                  {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="text-muted-foreground leading-relaxed">{featured.subtitle}</p>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500">
                  Read post
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Remaining posts */}
        {rest.length > 0 && (
          <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', featured && 'mt-8')}>
            {rest.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-3xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/30"
                >
                  {post.coverSrc && (
                    <div className="overflow-hidden border-b">
                      <img
                        src={post.coverSrc}
                        alt=""
                        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <PostMeta post={post} />
                    <h2 className="font-display text-xl font-bold tracking-tight leading-snug group-hover:text-amber-500 transition-colors">
                      {post.title}
                    </h2>
                    {post.subtitle && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{post.subtitle}</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-amber-500">
                      Read post
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer7 {...footerConfig} />
    </div>
  );
}
