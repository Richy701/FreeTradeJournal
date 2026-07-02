import { getFirebaseAuth } from '@/lib/firebase-lazy';

export interface AiMappingResult {
  // role -> exact column header name, or null when the file has no such column
  mapping: Record<string, string | null>;
  dayFirst: boolean | null;
  confidence: number | null;
  usage?: { used: number; limit: number; remaining: number };
}

// Ask the Pro-only `suggestCsvMapping` Cloud Function to map an unrecognized
// CSV's columns to our import roles. Returns null on ANY failure — not signed
// in, not Pro (permission-denied), rate-limited, or a network/parse error — so
// the caller transparently falls back to the manual mapping dialog.
export async function suggestCsvMappingAI(
  headers: string[],
  sampleRows: string[][]
): Promise<AiMappingResult | null> {
  try {
    await getFirebaseAuth(); // ensure the Firebase app is initialized + token ready
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const fn = httpsCallable(getFunctions(), 'suggestCsvMapping');
    const res = await fn({ headers, sampleRows });
    const data = res.data as AiMappingResult;
    if (!data || typeof data.mapping !== 'object' || data.mapping === null) return null;
    return data;
  } catch {
    return null;
  }
}
