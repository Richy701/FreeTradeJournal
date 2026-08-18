import { getFirebaseFunctions } from '@/lib/firebase-lazy';
import { isFreeAiQuotaError, notifyFreeAiQuotaExhausted } from '@/lib/ai-quota';
import type { PropFirmAccount, PropFirmTransaction, TransactionType } from '@/types/prop-tracker';

interface TradeInput {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  strategy?: string;
  riskReward?: number;
  emotions?: string;
}

export interface AIAnalysisRequest {
  trades: TradeInput[];
  analysisType: 'recent' | 'period';
}

export interface AIAnalysisResponse {
  analysis: string;
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
  freeUsage?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export async function requestAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const functions = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const analyzeTradesAI = httpsCallable<AIAnalysisRequest, AIAnalysisResponse>(
    functions,
    'analyzeTradesAI'
  );

  try {
    const result = await analyzeTradesAI(request);
    return result.data;
  } catch (err) {
    if (isFreeAiQuotaError(err)) notifyFreeAiQuotaExhausted();
    throw err;
  }
}

export interface PropAnalysisResponse {
  result: string;
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  type?: TransactionType;
  notes?: string;
}

export interface ScreenshotUsage {
  used: number;
  limit: number;
  remaining: number;
  // 'day' for Pro (20/day), 'total' for the free lifetime taste.
  scope?: 'day' | 'total';
}

export interface ScreenshotParseResponse {
  transactions: ParsedTransaction[];
  usage: ScreenshotUsage;
}

// One closed trade as read off a history screenshot by the vision model.
// Already sanitised server-side (finite numbers, normalised side); costs are
// signed as printed by the platform and times are the broker's wall clock.
export interface ScreenshotTrade {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  commission: number | null;
  swap: number | null;
  fees: number | null;
  openTime: string;
  closeTime: string;
  confidence: 'high' | 'low';
}

export interface ScreenshotTradesResponse {
  trades: ScreenshotTrade[];
  platform: string;
  currency: string | null;
  warnings: string[];
  usage: ScreenshotUsage;
}

export async function requestScreenshotParse(
  image: string,
  mimeType: string,
  importType: 'billing' | 'payout'
): Promise<ScreenshotParseResponse> {
  const fns = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');
  const parseScreenshotFn = httpsCallable<unknown, ScreenshotParseResponse>(fns, 'parseScreenshot');
  const result = await parseScreenshotFn({ image, mimeType, importType });
  return result.data;
}

export async function requestScreenshotTrades(
  image: string,
  mimeType: string,
): Promise<ScreenshotTradesResponse> {
  const fns = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');
  const parseScreenshotFn = httpsCallable<unknown, ScreenshotTradesResponse>(fns, 'parseScreenshot');
  const result = await parseScreenshotFn({ image, mimeType, importType: 'trades' });
  return result.data;
}

export async function requestPropAnalysis(
  accounts: PropFirmAccount[],
  transactions: PropFirmTransaction[]
): Promise<PropAnalysisResponse> {
  const fns = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const aiAssist = httpsCallable<unknown, PropAnalysisResponse>(fns, 'aiAssist');
  // Uniform account currency → send its symbol so the analysis doesn't talk
  // dollars to a EUR-only trader; mixed currencies keep the "$" fallback
  // (per-account symbols are already in the accounts data).
  const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF' };
  const codes = new Set(accounts.map((a) => a.currency || 'USD'));
  const currency = codes.size === 1 ? SYMBOLS[[...codes][0]] || '$' : '$';
  try {
    const result = await aiAssist({
      type: 'prop_tracker',
      payload: { accounts, transactions, currency },
    });
    return result.data;
  } catch (err) {
    if (isFreeAiQuotaError(err)) notifyFreeAiQuotaExhausted();
    throw err;
  }
}
