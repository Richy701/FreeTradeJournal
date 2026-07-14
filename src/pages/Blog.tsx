import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { SEOMeta } from '@/components/seo-meta';
import { posts, type BlogPost } from '@/lib/blog';

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function PostMeta({ post, featured }: { post: BlogPost; featured?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      {featured && (
        <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Featured
        </span>
      )}
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min read</span>
    </div>
  );
}

export default function Blog() {
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="Trading Blog | FreeTradeJournal — Prop Firm & Journaling Guides"
        description="Guides on prop firm trading, passing combines, and building a journaling habit that makes you consistent — from the team behind FreeTradeJournal."
        keywords="trading blog, prop firm blog, topstep guide, trading journal tips, funded trader blog"
      />
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {/* Masthead */}
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Blog</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Trade <span className="text-amber-500">smarter</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Guides on prop firms, journaling, and the habits that make traders consistent.
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid gap-6 lg:grid-cols-[3fr_2fr] rounded-3xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/30"
            >
              {featured.coverImage && (
                <div className="overflow-hidden lg:order-2">
                  <img
                    src={featured.coverImage}
                    alt=""
                    className="h-full w-full object-cover aspect-video lg:aspect-auto transition-transform duration-500 group-hover:scale-[1.03]"
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
                  {post.coverImage && (
                    <div className="overflow-hidden">
                      <img
                        src={post.coverImage}
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

      <AppFooter />
    </div>
  );
}
