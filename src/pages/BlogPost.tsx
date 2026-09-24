import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { MarketingHeader } from '@/components/marketing-header';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { SEOMeta } from '@/components/seo-meta';
import { JsonLd } from '@/components/json-ld';
import { cn } from '@/lib/utils';
import { getPost, posts, renderMarkdown, type Heading } from '@/lib/blog';

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Thin amber bar under the header tracking scroll progress through the article
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-40 h-0.5 bg-transparent" aria-hidden="true">
      <div
        className="h-full bg-amber-500 transition-[width] duration-100 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

// Section list for the desktop sidebar. Highlights the section currently at
// the top of the viewport.
function OnThisPage({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');

  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    const onScroll = () => {
      const line = window.scrollY + 140;
      let current = els[0]?.id ?? '';
      for (const el of els) {
        if (el.offsetTop <= line) current = el.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
      <ol className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-4 text-sm leading-snug transition-colors',
                activeId === h.id
                  ? 'border-amber-500 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hand-rolled prose styles — the repo doesn't use @tailwindcss/typography.
// The first paragraph renders larger as an editorial lead. Product screenshots
// already carry their own frame (CleanShot backdrop), so images get rounded
// corners only, no second border or shadow.
const PROSE =
  '[&>p:first-of-type]:text-xl [&>p:first-of-type]:text-foreground/90 ' +
  '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-28 ' +
  '[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 ' +
  '[&_p]:text-lg [&_p]:leading-[1.8] [&_p]:mb-5 [&_p]:text-foreground/85 ' +
  '[&_a]:text-amber-500 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-amber-600 ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul]:space-y-1.5 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol]:space-y-1.5 ' +
  '[&_li]:text-lg [&_li]:leading-relaxed [&_li]:text-foreground/85 ' +
  '[&_strong]:font-semibold [&_strong]:text-foreground ' +
  '[&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-6 ' +
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm ' +
  '[&_img]:rounded-xl [&_img]:my-8 [&_img]:w-full ' +
  '[&_hr]:my-10 [&_hr]:border-border ' +
  '[&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:text-sm ' +
  '[&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-3 [&_th]:align-top ' +
  '[&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_td]:text-foreground/85 [&_td]:leading-relaxed ' +
  // Below sm the table stacks: each row becomes a block with the first cell as its heading.
  'max-sm:[&_table]:block max-sm:[&_thead]:hidden max-sm:[&_tbody]:block max-sm:[&_tr]:block max-sm:[&_tr]:border-b max-sm:[&_tr]:border-border max-sm:[&_tr]:py-3 ' +
  'max-sm:[&_td]:block max-sm:[&_td]:border-0 max-sm:[&_td]:py-0.5 max-sm:[&_td]:pr-0 max-sm:[&_td:first-child]:font-semibold max-sm:[&_td:first-child]:text-foreground';

// Article column plus a desktop sidebar. The column is wide enough to read
// comfortably and the sidebar fills the rest of the container, so the page no
// longer runs a narrow strip down the middle of a wide screen.
const COLUMNS = 'lg:grid lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:gap-14 xl:gap-20';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  const rendered = useMemo(() => (post ? renderMarkdown(post.body) : null), [post]);

  if (!post || !rendered) return <Navigate to="/blog" replace />;

  const index = posts.findIndex((p) => p.slug === post.slug);
  const nextPost = posts[(index + 1) % posts.length];
  const morePosts = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const url = `https://www.freetradejournal.com/blog/${post.slug}`;
  const wordCount = post.body.split(/\s+/).length;

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title={post.seoTitle}
        description={post.subtitle || post.title}
        keywords={post.tags.join(', ')}
        image={post.coverImage}
      />
      <JsonLd
        id="blog-post-jsonld"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              '@id': `${url}#article`,
              mainEntityOfPage: { '@type': 'WebPage', '@id': url },
              url,
              headline: post.title,
              description: post.subtitle || post.title,
              image: post.coverImage ? [post.coverImage] : undefined,
              datePublished: post.date,
              dateModified: post.updated || post.date,
              author: { '@type': 'Organization', name: 'FreeTradeJournal', url: 'https://www.freetradejournal.com' },
              publisher: {
                '@type': 'Organization',
                name: 'FreeTradeJournal',
                url: 'https://www.freetradejournal.com',
                logo: { '@type': 'ImageObject', url: 'https://www.freetradejournal.com/favicon-512x512.png', width: 512, height: 512 },
              },
              articleSection: post.category,
              keywords: post.tags.join(', '),
              wordCount,
              inLanguage: 'en',
              isPartOf: { '@type': 'Blog', '@id': 'https://www.freetradejournal.com/blog#blog' },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.freetradejournal.com/' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.freetradejournal.com/blog' },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />
      <MarketingHeader />
      <ReadingProgress />

      {/* Article header: the landing page's backdrop, full bleed */}
      <section className="relative overflow-hidden bg-background noise-overlay">
        <GeometricBackdrop />
        <div className={cn('relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-10 sm:pt-40 sm:pb-12', COLUMNS)}>
          <div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              All posts
            </Link>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                {post.category}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated && post.updated !== post.date && (
                  <>
                    <span aria-hidden="true"> · </span>
                    Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </>
                )}
                <span aria-hidden="true"> · </span>
                {post.readingMinutes} min read
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-[2.5rem] sm:leading-[1.15] font-bold tracking-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-5 text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {post.subtitle}
              </p>
            )}
          </div>
          {/* Cover sits beside the title on desktop so the header and the
              article/sidebar columns start together. */}
          {post.coverSrc && (
            <div className="hidden lg:flex lg:items-end">
              <img
                src={post.coverSrc}
                alt=""
                className="w-full aspect-video rounded-2xl border object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </section>

      <div className={cn('max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-16', COLUMNS)}>
        <article className="min-w-0">
          <div
            className={PROSE}
            // Repo-authored markdown only — see renderMarkdown in src/lib/blog.ts
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />

          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* End-of-post CTA: plain prose, no promo box */}
          <div className="mt-12 border-t pt-8">
            <p className="leading-relaxed text-foreground/85">
              FreeTradeJournal is the journal this post is about. Unlimited trades, broker CSV import
              and goal tracking on the free plan. No card required.
            </p>
            <Link
              to="/signup"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-600 transition-colors"
            >
              Start journaling free
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {nextPost && nextPost.slug !== post.slug && (
            <Link
              to={`/blog/${nextPost.slug}`}
              className="group mt-8 flex items-center justify-between gap-4 rounded-3xl border bg-card p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Read next
                </p>
                <p className="font-display font-bold tracking-tight group-hover:text-amber-500 transition-colors">
                  {nextPost.title}
                </p>
              </div>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}
        </article>

        {/* Desktop sidebar: section list, other posts, signup */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-10 pt-6">
            <OnThisPage headings={rendered.headings} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">More posts</p>
              <ul className="space-y-4">
                {morePosts.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/blog/${p.slug}`} className="group block">
                      <p className="text-sm font-semibold leading-snug group-hover:text-amber-500 transition-colors">
                        {p.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.category}
                        <span aria-hidden="true"> · </span>
                        {p.readingMinutes} min read
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <p className="font-display font-bold tracking-tight">Try it on your own trades</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Import last month from your broker and see your win rate by session. Free, no card.
              </p>
              <Link
                to="/signup"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
              >
                Create a free account
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <Footer7 {...footerConfig} />
    </div>
  );
}
