import { describe, expect, it, vi } from 'vitest';
import { recordedEmailSender, reliableEmailSender, requireProviderSuccess } from '../src/email-delivery';

describe('email provider failures', () => {
  const payload = { from: 'sender@example.com', to: 'recipient@example.com', subject: 'test', html: '<p>test</p>' };
  it('does not treat rejected enrollment as success', () => {
    expect(() => requireProviderSuccess({ data: null, error: { message: 'Invalid API key' } })).toThrow('Invalid API key');
  });
  it('retries a temporary rejection using the same idempotency key', async () => {
    const send = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Slow down', statusCode: 429 } })
      .mockResolvedValue({ data: { id: 'accepted' }, error: null });
    const wait = vi.fn().mockResolvedValue(undefined);
    await expect(reliableEmailSender(send, wait)(payload)).resolves.toMatchObject({ data: { id: 'accepted' } });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][1].idempotencyKey).toBe(send.mock.calls[1][1].idempotencyKey);
  });
  it('throws permanent errors without retrying or returning acceptance', async () => {
    const send = vi.fn().mockResolvedValue({ data: null, error: { message: 'Invalid API key', statusCode: 403 } });
    await expect(reliableEmailSender(send)(payload)).rejects.toThrow('Invalid API key');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('bounds retries and keeps a caller-supplied key', async () => {
    const send = vi.fn().mockResolvedValue({ data: null, error: { message: 'Unavailable', statusCode: 503 } });
    await expect(reliableEmailSender(send, async () => {})(payload, { idempotencyKey: 'billing-event' })).rejects.toThrow('Unavailable');
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.every(call => call[1].idempotencyKey === 'billing-event')).toBe(true);
  });
  it('does not resend an accepted billing message when the webhook is replayed', async () => {
    const receipts = new Map<string, string>();
    const rawSend = vi.fn().mockResolvedValue({ data: { id: 'accepted' }, error: null, headers: null });
    const send = recordedEmailSender(rawSend, {
      acceptedId: async key => receipts.get(key),
      accept: async (key, id) => { receipts.set(key, id); },
      fail: async () => {},
    });
    await send(payload, { idempotencyKey: 'checkout/session' });
    await send(payload, { idempotencyKey: 'checkout/session' });
    expect(rawSend).toHaveBeenCalledTimes(1);
  });
  it('records a failed attempt without marking it accepted and allows a later retry', async () => {
    const accept = vi.fn().mockResolvedValue(undefined);
    const fail = vi.fn().mockResolvedValue(undefined);
    const rawSend = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Rejected' } })
      .mockResolvedValue({ data: { id: 'accepted' }, error: null, headers: null });
    const send = recordedEmailSender(rawSend, { acceptedId: async () => undefined, accept, fail });
    await expect(send(payload, { idempotencyKey: 'checkout/session' })).rejects.toThrow('Rejected');
    expect(accept).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith('checkout/session');
    await send(payload, { idempotencyKey: 'checkout/session' });
    expect(accept).toHaveBeenCalledWith('checkout/session', 'accepted');
  });
});

