import { getFirebaseFunctions } from '@/lib/firebase-lazy';

export async function redirectToCheckout(priceId: string): Promise<void> {
  const functions = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const createSession = httpsCallable<{ priceId: string }, { url: string }>(
    functions,
    'createCheckoutSession',
  );

  const result = await createSession({ priceId });
  const url = result.data.url;

  if (url) {
    window.location.href = url;
  } else {
    throw new Error('Failed to create checkout session');
  }
}

export async function redirectToPortal(): Promise<void> {
  const functions = await getFirebaseFunctions();
  const { httpsCallable } = await import('firebase/functions');

  const createSession = httpsCallable<void, { url: string }>(
    functions,
    'createPortalSession',
  );

  const result = await createSession();
  const url = result.data.url;

  if (url) {
    window.location.href = url;
  } else {
    throw new Error('Failed to create portal session');
  }
}
