import { marked } from 'marked';

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  coverImage?: string;
  date: string; // ISO yyyy-mm-dd
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
      subtitle: meta.subtitle || '',
      tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()) : [],
      coverImage: meta.coverImage,
      date: meta.date || '',
      body,
      readingMinutes: Math.max(1, Math.round(words / 220)),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

// Posts are repo-controlled content written by us, so rendering without a
// sanitizer is safe — do not point this at user-supplied markdown.
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
