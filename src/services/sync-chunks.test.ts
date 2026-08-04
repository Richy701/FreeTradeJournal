import { describe, it, expect } from 'vitest';
import {
  splitSyncValue,
  joinSyncChunks,
  syncChunkDocId,
  SYNC_CHUNK_CHARS,
} from '../../functions/src/sync-chunks';

describe('splitSyncValue / joinSyncChunks', () => {
  it('keeps small payloads as a single part', () => {
    expect(splitSyncValue('[]')).toEqual(['[]']);
    expect(splitSyncValue('x'.repeat(SYNC_CHUNK_CHARS))).toHaveLength(1);
  });

  it('splits one char over the limit into two parts', () => {
    const parts = splitSyncValue('x'.repeat(SYNC_CHUNK_CHARS + 1));
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(SYNC_CHUNK_CHARS);
    expect(parts[1]).toHaveLength(1);
  });

  it('round-trips a large ASCII payload exactly', () => {
    // ~1.1M chars ≈ a ~2,200-trade JSON blob — past the old ceiling.
    const original = JSON.stringify(
      Array.from({ length: 2200 }, (_, i) => ({
        id: `csv-${i}`, symbol: 'EURUSD', pnl: i * 0.01,
        notes: 'Imported from 14138031-trading-data.csv'.repeat(8),
      })),
    );
    expect(original.length).toBeGreaterThan(SYNC_CHUNK_CHARS);
    const parts = splitSyncValue(original);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(SYNC_CHUNK_CHARS);
    expect(joinSyncChunks(parts)).toBe(original);
  });

  it('never splits a surrogate pair at a chunk boundary', () => {
    // Position an emoji (astral, 2 UTF-16 units) straddling the boundary.
    const emoji = '\u{1F4C8}'; // chart-increasing, surrogate pair
    const original = 'a'.repeat(SYNC_CHUNK_CHARS - 1) + emoji.repeat(50_000);
    const parts = splitSyncValue(original);
    for (const p of parts) {
      const last = p.charCodeAt(p.length - 1);
      expect(last >= 0xd800 && last <= 0xdbff).toBe(false); // no lone high surrogate
      const first = p.charCodeAt(0);
      expect(first >= 0xdc00 && first <= 0xdfff).toBe(false); // no lone low surrogate
    }
    expect(joinSyncChunks(parts)).toBe(original);
  });

  it('keeps every chunk under the Firestore byte cap even for 3-byte chars', () => {
    // CJK chars: 1 UTF-16 unit → 3 UTF-8 bytes, the worst per-unit expansion.
    const original = '測'.repeat(SYNC_CHUNK_CHARS * 2 + 7);
    const parts = splitSyncValue(original);
    for (const p of parts) {
      expect(Buffer.byteLength(p, 'utf8')).toBeLessThan(1_048_576);
    }
    expect(joinSyncChunks(parts)).toBe(original);
  });

  it('produces chunk doc ids that cannot collide with sync keys', () => {
    expect(syncChunkDocId('trades', 0)).toBe('trades.c0');
    expect(syncChunkDocId('trades', 12)).toBe('trades.c12');
  });
});
