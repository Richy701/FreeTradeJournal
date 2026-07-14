import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { SEOMeta } from '@/components/seo-meta';
import { getPost, posts, renderMarkdown } from '@/lib/blog';

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

// Hand-rolled prose styles — the repo doesn't use @tailwindcss/typography.
// The first paragraph renders larger as an editorial lead; inline product
// screenshots get a proper frame so they read as figures, not page chrome.
const PROSE =
  '[&>p:first-of-type]:text-lg [&>p:first-of-type]:text-foreground/90 ' +
  '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 ' +
  '[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 ' +
  '[&_p]:leading-[1.8] [&_p]:mb-5 [&_p]:text-foreground/85 ' +
  '[&_a]:text-amber-500 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-amber-600 ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul]:space-y-1.5 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol]:space-y-1.5 ' +
  '[&_li]:leading-relaxed [&_li]:text-foreground/85 ' +
  '[&_strong]:font-semibold [&_strong]:text-foreground ' +
  '[&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-6 ' +
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm ' +
  '[&_img]:rounded-xl [&_img]:border [&_img]:my-8 [&_img]:max-w-full [&_img]:shadow-lg [&_img]:shadow-black/10 ' +
  '[&_hr]:my-10 [&_hr]:border-border';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const nextPost = posts[(posts.findIndex((p) => p.slug === post.slug) + 1) % posts.length];

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title={`${post.title} | FreeTradeJournal Blog`}
        description={post.subtitle || post.title}
        keywords={post.tags.join(', ')}
        image={post.coverImage}
      />
      <SiteHeader />
      <ReadingProgress />

      <div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All posts
          </Link>
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
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
      </div>

      <article className="max-w-2xl mx-auto px-4 sm:px-6 pt-2 pb-16">
        <div
          className={PROSE}
          // Repo-authored markdown only — see renderMarkdown in src/lib/blog.ts
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
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

        {/* End-of-post CTA — plain prose, no promo box */}
        <div className="mt-12 border-t pt-8">
          <p className="leading-relaxed text-foreground/85">
            FreeTradeJournal is the free journal this post is about — unlimited trades, broker CSV
            import, and every new account starts with 14 days of Pro. No card required.
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

      <AppFooter />
    </div>
  );
}
