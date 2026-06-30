import DOMPurify from 'dompurify';

// Shared, dependency-free renderer for the small subset of markdown our app
// produces and accepts: `#`..`######` headings, **bold**, `inline code`,
// "- "/"* " bullet lists, "1." numbered lists, and blank-line-separated
// paragraphs. Callers vary only in styling and a couple of pre-processing
// choices, so those are options — the parsing/flushing logic lives here once.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface MarkdownRenderOptions {
  // Escape HTML entities before applying markdown — required for user-entered
  // text (journal entries) so raw `<` / `>` can't inject markup.
  escape?: boolean;
  // Transform the whole source first (e.g. normalise em/en dashes).
  preprocess?: (s: string) => string;
  // Highest heading level recognised (default 3).
  maxHeadingLevel?: number;
  // Strip a single trailing colon from headings ("Where You Stand:" → heading).
  stripHeadingColon?: boolean;
  // Class names for emitted elements. `heading` receives the level (1-N).
  classes?: {
    heading?: (level: number) => string;
    paragraph?: string;
    ul?: string;
    ol?: string;
    code?: string;
  };
  // Inline tags to allow through DOMPurify on top of the structural defaults.
  allowedInlineTags?: string[];
}

export function renderMarkdown(src: string, options: MarkdownRenderOptions = {}): string {
  const {
    escape = false,
    preprocess,
    maxHeadingLevel = 3,
    stripHeadingColon = false,
    classes = {},
    allowedInlineTags = [],
  } = options;

  const cls = (name?: string) => (name ? ` class="${name}"` : '');
  const codeAttr = cls(classes.code);
  const inline = (s: string) =>
    (escape ? escapeHtml(s) : s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, `<code${codeAttr}>$1</code>`);

  const source = preprocess ? preprocess(src) : src;
  const headingRe = new RegExp(
    `^#{1,${maxHeadingLevel}}\\s+(.+?)${stripHeadingColon ? ':?' : ''}\\s*$`
  );

  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    const heading = line.match(headingRe);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);

    if (heading) {
      closeList();
      const level = line.match(/^#+/)![0].length;
      out.push(`<p${cls(classes.heading?.(level))}>${inline(heading[1])}</p>`);
    } else if (bullet) {
      if (list !== 'ul') { closeList(); out.push(`<ul${cls(classes.ul)}>`); list = 'ul'; }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      if (list !== 'ol') { closeList(); out.push(`<ol${cls(classes.ol)}>`); list = 'ol'; }
      out.push(`<li>${inline(numbered[1])}</li>`);
    } else {
      closeList();
      out.push(`<p${cls(classes.paragraph)}>${inline(line)}</p>`);
    }
  }
  closeList();

  return DOMPurify.sanitize(out.join(''), {
    ALLOWED_TAGS: ['strong', 'code', 'li', 'ul', 'ol', 'p', ...allowedInlineTags],
    ALLOWED_ATTR: ['class'],
  });
}
