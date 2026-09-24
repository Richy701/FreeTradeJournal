import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string; // short, keyword-led <title>; falls back to the title
  subtitle: string;
  category: string;
  tags: string[];
  coverImage?: string; // absolute URL, for og:image
  coverSrc?: string; // same image, site-relative, for <img> so it loads on any origin
  date: string; // ISO yyyy-mm-dd, first published
  updated?: string; // ISO yyyy-mm-dd, last substantive edit
  body: string; // raw markdown
  readingMinutes: number;
}

// Posts live in /posts/*.md at the repo root — the same files
// scripts/publish-post.mjs used to push to the old Ghost blog. The slug is the
// filename; scripts/prerender.mjs derives the /blog/<slug> routes from the
// same directory so every post ships as static HTML.
const rawPosts = import.meta.glob('/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Same frontmatter format publish-post.mjs used (key: value lines)
function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  match[1].split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  });

  return { meta, body: match[2].trim() };
}

export const posts: BlogPost[] = Object.entries(rawPosts)
  .map(([path, text]) => {
    const slug = path.replace(/^.*\//, '').replace(/\.md$/, '');
    const { meta, body } = parseFrontmatter(text);
    const words = body.split(/\s+/).length;
    return {
      slug,
      title: meta.title || slug,
      seoTitle: meta.seoTitle || `${meta.title || slug} | FreeTradeJournal`,
      subtitle: meta.subtitle || '',
      category: meta.category || 'Guides',
      tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()) : [],
      coverImage: meta.coverImage,
      coverSrc: meta.coverImage?.replace(/^https:\/\/(www\.)?freetradejournal\.com/, ''),
      date: meta.date || '',
      updated: meta.updated || undefined,
      body,
      readingMinutes: Math.max(1, Math.round(words / 220)),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

// Categories in the order they first appear in the (date-sorted) post list.
export const categories: string[] = Array.from(new Set(posts.map((p) => p.category)));

export interface Heading {
  id: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Posts are repo-controlled content written by us, but sanitize anyway —
// belt-and-braces so this can never become stored XSS if blog content ever
// starts flowing from a CMS or external source.
// Section headings get an id so the post sidebar can link to them; marked no
// longer adds ids itself.
export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const raw = (marked.parse(md, { async: false }) as string).replace(
    /<h2>([\s\S]*?)<\/h2>/g,
    (_m, inner: string) => {
      const id = slugify(inner);
      headings.push({ id, text: inner.replace(/<[^>]+>/g, '') });
      return `<h2 id="${id}">${inner}</h2>`;
    },
  );
  return { html: DOMPurify.sanitize(raw), headings };
}
