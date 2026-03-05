import { getFirebaseFunctions } from '@/lib/firebase-lazy';

export type AIAssistType =
  | 'journal_prompts'
  | 'trade_review'
  | 'risk_alert'
  | 'strategy_tagger'
  | 'goal_coach'
  | 'coaching_tips';

export interface AIAssistRequest {
  type: AIAssistType;
  payload: Record<string, any>;
}

export interface AIAssistResponse {
  result: string;
  usage: { used: number; limit: number; remaining: number };
}

export async function requestAIAssist(request: AIAssistRequest): Promise<AIAssistResponse> {
  const functions = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');
  const aiAssist = httpsCallable<AIAssistRequest, AIAssistResponse>(functions, 'aiAssist');
  const result = await aiAssist(request);
  return result.data;
}
