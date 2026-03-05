import { getFirebaseFunctions } from '@/lib/firebase-lazy';

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
