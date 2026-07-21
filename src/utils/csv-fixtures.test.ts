import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCSV } from './csv-parser';

// Golden corpus: every real-world broker export we've seen lives in __fixtures__.
// Each must auto-import (no manual column mapping) with zero row failures. Drop a
// new CSV in that folder and it becomes a permanent regression guard — no test
// code change required. See __fixtures__/README.md.
const FIXTURE_DIR = join(process.cwd(), 'src/utils/__fixtures__');

// Optional exact trade counts, keyed by filename. Files not listed only need to
// import successfully with no failures.
const EXPECTED_TRADES: Record<string, number> = {
  'tradovate-orders-history.csv': 6,
  'tradovate-trades-performance.csv': 2,
  'topstep-trades.csv': 2,
  'mt5-position-history.csv': 2,
  'standard-mt5-like.csv': 2,
  'das-trades.csv': 4,
};

describe('CSV fixture corpus — real broker exports import cleanly', () => {
  const files = readdirSync(FIXTURE_DIR).filter(f => f.toLowerCase().endsWith('.csv'));

  it('has at least one fixture', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`imports ${file} with no row failures`, () => {
      const csv = readFileSync(`${FIXTURE_DIR}/${file}`, 'utf8');
      const r = parseCSV(csv);
      expect(r.success, `errors: ${r.errors.join('; ')}`).toBe(true);
      expect(r.trades.length).toBeGreaterThan(0);
      expect(r.summary.failed).toBe(0);
      if (EXPECTED_TRADES[file] !== undefined) {
        expect(r.trades.length).toBe(EXPECTED_TRADES[file]);
      }
    });
  }
});
