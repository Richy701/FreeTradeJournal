import { getFirebaseFunctions } from '@/lib/firebase-lazy';
import { isFreeAiQuotaError, notifyFreeAiQuotaExhausted } from '@/lib/ai-quota';

export type AIAssistType =
  | 'journal_prompts'
  | 'trade_review'
  | 'risk_alert'
  | 'position_check'
  | 'strategy_tagger'
  | 'goal_coach'
  | 'coaching_tips'
  | 'journal_review'
  | 'journal_assist'
  | 'import_insight';

export interface AIAssistRequest {
  type: AIAssistType;
  payload: Record<string, any>;
}

export interface AIAssistResponse {
  result: string;
  usage: { used: number; limit: number; remaining: number };
  freeUsage?: { used: number; limit: number; remaining: number };
}

export async function requestAIAssist(request: AIAssistRequest): Promise<AIAssistResponse> {
  const [functions, { httpsCallable }] = await Promise.all([
    getFirebaseFunctions(),
    import('firebase/functions'),
  ]);
  const aiAssist = httpsCallable<AIAssistRequest, AIAssistResponse>(functions, 'aiAssist');
  try {
    const result = await aiAssist(request);
    return result.data;
  } catch (err) {
    // A denied call means this tab's cached quota is stale — flip hasAIAccess
    // off so auto-firing features stop asking (see lib/ai-quota.ts).
    if (isFreeAiQuotaError(err)) notifyFreeAiQuotaExhausted();
    throw err;
  }
}
