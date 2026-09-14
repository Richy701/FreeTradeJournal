import { randomUUID } from 'crypto';
import type { Resend } from 'resend';

interface ProviderError { message: string; statusCode?: number | null; name?: string }

export function requireProviderSuccess<T extends { data: unknown; error: ProviderError | null }>(result: T): T {
  if (result.error || !result.data) {
    throw new Error(`Email provider: ${result.error?.message || 'No acceptance receipt returned'}`);
  }
  return result;
}

// The SDK resolves with { error } on HTTP/network failures; awaiting it alone
// does not mean the provider accepted the message. Keep one key across retries.
export function reliableEmailSender(
  send: Resend['emails']['send'],
  wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Resend['emails']['send'] {
  return async (payload, options) => {
    const request = { ...options, idempotencyKey: options?.idempotencyKey || randomUUID() };
    for (let attempt = 0; ; attempt++) {
      const result = await send(payload, request);
      const status = result.error?.statusCode;
      const retryable = result.error && (status == null || status === 429 || status >= 500);
      if (retryable && attempt < 2) {
        await wait(1000 * 2 ** attempt);
        continue;
      }
      return requireProviderSuccess(result);
    }
  };
}

export interface DeliveryReceipts {
  acceptedId(key: string): Promise<string | undefined>;
  accept(key: string, emailId: string): Promise<void>;
  fail(key: string): Promise<void>;
}

export function recordedEmailSender(send: Resend['emails']['send'], receipts: DeliveryReceipts): Resend['emails']['send'] {
  return async (payload, options) => {
    const key = options?.idempotencyKey || randomUUID();
    const acceptedId = await receipts.acceptedId(key);
    if (acceptedId) return { data: { id: acceptedId }, error: null, headers: null };
    try {
      const result = requireProviderSuccess(await send(payload, { ...options, idempotencyKey: key }));
      await receipts.accept(key, result.data!.id);
      return result;
    } catch (err) {
      await receipts.fail(key).catch(() => {});
      throw err;
    }
  };
}
