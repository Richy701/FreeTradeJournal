/**
 * Trim a typed tag and drop a leading "#" so "#FVG" and "FVG" are the same tag.
 * Returns an empty string for blank input.
 */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim();
}

/** Split a comma-separated tag string (the journal's stored form) into clean tags. */
export function parseTagString(value: string): string[] {
  return dedupeTags(value.split(',').map(normalizeTag));
}

/** Case-insensitive de-duplication that keeps the first spelling seen. */
export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}


/**
 * A tag that starts with "!" marks a mistake ("!chased", "!moved-stop") rather
 * than a setup. Mistakes get their own cost breakdown in Insights and are kept
 * out of the setup table, so a trader can see what a habit is costing them.
 */
export const MISTAKE_PREFIX = '!';

export function isMistakeTag(tag: string): boolean {
  return normalizeTag(tag).startsWith(MISTAKE_PREFIX);
}

/** The tag without its mistake marker, for display ("!chased" → "chased"). */
export function tagLabel(tag: string): string {
  return normalizeTag(tag).replace(/^!+/, '').trim();
}

/** Case-insensitive grouping key, so "FVG" and "fvg" land in one bucket. */
export function tagKey(tag: string): string {
  return tagLabel(tag).toLowerCase();
}
