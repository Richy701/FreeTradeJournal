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

