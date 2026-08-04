// Chunking helpers for oversized sync payloads.
//
// Firestore caps a document at 1,048,576 bytes, which used to be the hard
// ceiling on a user's entire synced trade history — the client silently
// stopped syncing past ~950KB (~2,000 trades). Payloads larger than one doc
// are now split across `${key}.c{i}` chunk docs referenced by a
// `{chunked: true, chunkCount}` manifest in the key's own doc.
//
// Kept dependency-free (no firebase imports) so the app's vitest suite can
// exercise the split logic directly — functions/ has no test runner.
//
// Size math: payload strings are UTF-16 in JS but stored as UTF-8. A BMP char
// can take up to 3 bytes per UTF-16 unit; a 4-byte astral char (emoji) spans
// two units. 250,000 units is therefore ≤ 750KB worst-case — safely under the
// doc cap with room for the updatedAt field and doc overhead.
export const SYNC_CHUNK_CHARS = 250_000;

// Above this many chunks something is wrong (25M+ chars); readers treat the
// manifest as corrupt rather than fan out unbounded reads.
export const SYNC_MAX_CHUNKS = 100;

export function syncChunkDocId(key: string, index: number): string {
  // Sync keys never contain a dot, so chunk ids can't collide with real keys.
  return `${key}.c${index}`;
}

// Split a payload into chunk parts. Never splits a surrogate pair: a chunk
// ending in a lone high surrogate is invalid UTF-8 and Firestore rejects the
// write (which would fail the whole batch).
export function splitSyncValue(value: string): string[] {
  if (value.length <= SYNC_CHUNK_CHARS) return [value];
  const parts: string[] = [];
  let i = 0;
  while (i < value.length) {
    let end = Math.min(i + SYNC_CHUNK_CHARS, value.length);
    if (end < value.length) {
      const c = value.charCodeAt(end - 1);
      if (c >= 0xd800 && c <= 0xdbff) end -= 1; // high surrogate — back off
    }
    parts.push(value.slice(i, end));
    i = end;
  }
  return parts;
}

export function joinSyncChunks(parts: string[]): string {
  return parts.join('');
}
