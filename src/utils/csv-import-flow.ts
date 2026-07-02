// Decides how to rescue a CSV whose format auto-detect couldn't parse, shared by
// the Dashboard and Trade Log import flows so the two can't drift. Two silent
// rescue attempts before we bother the user with the manual mapping dialog:
//   1) replay a mapping the user previously confirmed for this file shape (memory)
//   2) Pro only: ask the LLM to map the columns, then re-parse locally
import { parseCSVWithMappings, parseCSVSample, type CSVParseResult } from './csv-parser';
import { headerSignature, recallMapping, rememberMapping, resolveNamedMapping, type StorageLike } from './csv-import-memory';
import { suggestCsvMappingAI } from '@/lib/csv-ai-mapping';
import { trackEvent } from '@/lib/analytics';

export type RescueOutcome =
  | { kind: 'parsed'; result: CSVParseResult; via: 'memory' | 'ai' }
  | { kind: 'manual' }; // caller should open the manual mapping dialog

export interface RescueOptions {
  content: string;
  headers: string[];
  storage: StorageLike;
  isPro: boolean;
  isDemo: boolean;
  source: string; // 'tradelog' | 'dashboard' — for telemetry
}

export async function rescueFailedImport(opts: RescueOptions): Promise<RescueOutcome> {
  const { content, headers, storage, isPro, isDemo, source } = opts;
  const signature = headerSignature(headers);

  // 1) Memory — a mapping this user already confirmed for this exact file shape.
  const remembered = recallMapping(storage, headers);
  if (remembered) {
    const remapped = parseCSVWithMappings(content, remembered);
    if (remapped.success && remapped.trades.length > 0) {
      trackEvent('csv_import_auto_remapped', { source, signature });
      return { kind: 'parsed', result: remapped, via: 'memory' };
    }
  }

  // 2) LLM auto-mapping — Pro only, never in demo. On success we remember the
  // mapping so the same broker imports instantly next time (no further LLM call).
  if (isPro && !isDemo) {
    const ai = await suggestCsvMappingAI(headers, parseCSVSample(content, 5));
    if (ai) {
      const resolved = resolveNamedMapping(headers, ai.mapping);
      if (resolved) {
        const remapped = parseCSVWithMappings(content, resolved);
        if (remapped.success && remapped.trades.length > 0) {
          rememberMapping(storage, headers, resolved);
          trackEvent('csv_import_ai_mapped', {
            source,
            signature,
            confidence: ai.confidence,
            trades: remapped.trades.length,
          });
          return { kind: 'parsed', result: remapped, via: 'ai' };
        }
      }
      // The model returned something, but it didn't yield trades — record it so
      // we can see where AI mapping falls short, then fall back to manual.
      trackEvent('csv_import_ai_mapping_unusable', { source, signature, confidence: ai.confidence });
    }
  }

  return { kind: 'manual' };
}
