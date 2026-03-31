import { getFirebaseFunctions } from '@/lib/firebase-lazy';
import type { PropFirmAccount, PropFirmTransaction } from '@/types/prop-tracker';

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
}

export async function requestAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const functions = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const analyzeTradesAI = httpsCallable<AIAnalysisRequest, AIAnalysisResponse>(
    functions,
    'analyzeTradesAI'
  );

  const result = await analyzeTradesAI(request);
  return result.data;
}

export interface PropAnalysisResponse {
  result: string;
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export async function requestPropAnalysis(
  accounts: PropFirmAccount[],
  transactions: PropFirmTransaction[]
): Promise<PropAnalysisResponse> {
  const fns = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const aiAssist = httpsCallable<unknown, PropAnalysisResponse>(fns, 'aiAssist');
  const result = await aiAssist({
    type: 'prop_tracker',
    payload: { accounts, transactions },
  });
  return result.data;
}
