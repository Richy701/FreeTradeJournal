import { useState, useCallback, useRef } from 'react';
import { getFirebaseAuth } from '@/lib/firebase-lazy';
import { useAuth } from '@/contexts/auth-context';
import { getDemoAIResponse, DEMO_AI_USAGE } from '@/lib/demo-ai';
import type { FreeAIQuota } from '@/contexts/pro-context';

function getStreamUrl(): string {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    return 'http://localhost:5001/' + import.meta.env.VITE_FIREBASE_PROJECT_ID + '/us-central1/aiStream';
  }
  return `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/aiStream`;
}

interface StreamMeta {
  usage: { used: number; limit: number; remaining: number };
  freeUsage?: FreeAIQuota;
}

interface UseStreamingAIReturn {
  streamText: string;
  isStreaming: boolean;
  error: string | null;
  meta: StreamMeta | null;
  startStream: (endpoint: 'analysis' | 'assist', data: any) => Promise<string>;
  abort: () => void;
}

export function useStreamingAI(): UseStreamingAIReturn {
  const { isDemo } = useAuth();
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const startStream = useCallback(async (endpoint: 'analysis' | 'assist', data: any): Promise<string> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreamText('');
    setIsStreaming(true);
    setError(null);
    setMeta(null);

    // Demo mode: stream a pre-written response with a typewriter effect so the
    // feature looks live, without any backend call.
    if (isDemo) {
      const full = getDemoAIResponse(endpoint, data);
      let shown = '';
      try {
        for (const token of full.split(/(\s+)/)) {
          if (controller.signal.aborted) break;
          shown += token;
          setStreamText(shown);
          await new Promise(resolve => setTimeout(resolve, 14));
        }
        setMeta({ usage: DEMO_AI_USAGE });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
      return shown;
    }

    let fullText = '';

    try {
      const auth = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();

      const response = await fetch(getStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint, data }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);
            if (event.error) {
              throw new Error(event.error);
            }
            if (event.text) {
              fullText += event.text;
              setStreamText(fullText);
            }
            if (event.done) {
              setMeta({ usage: event.usage, freeUsage: event.freeUsage });
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const msg = e?.message || 'Streaming failed';
        setError(msg);
        throw e;
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }

    return fullText;
  }, [isDemo]);

  return { streamText, isStreaming, error, meta, startStream, abort };
}
