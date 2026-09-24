import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { posts } from '@/lib/blog';

// Three blog cards for a marketing page. Loaded lazily by its callers so the
// post markdown never lands in the landing or firm page chunks. Body links to
// the posts are what get Google to crawl them; the footer alone has not.
export function BlogStrip({
  slugs,
  eyebrow = 'From the blog',
  title,
  subtitle,
}: {
  slugs?: string[];
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  const picked = slugs
    ? slugs.map((s) => posts.find((p) => p.slug === s)).filter((p): p is (typeof posts)[number] => Boolean(p))
    : posts.slice(0, 3);

  if (picked.length === 0) return null;

  return (
    <section className="w-full py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-500">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          {subtitle && <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picked.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-all hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5"
            >
              {post.coverSrc && (
                <div className="overflow-hidden border-b">
                  <img
                    src={post.coverSrc}
                    alt=""
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    width={1600}
                    height={900}
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-6">
                <p className="text-xs font-medium text-muted-foreground">
                  {post.category}
                  <span aria-hidden="true"> · </span>
                  {post.readingMinutes} min read
                </p>
                <h3 className="font-display text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-amber-500">
                  {post.title}
                </h3>
                {post.subtitle && <p className="text-sm leading-relaxed text-muted-foreground">{post.subtitle}</p>}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-amber-500">
                  Read post
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors">
            All posts
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
