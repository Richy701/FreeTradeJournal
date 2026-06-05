import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const REFERRAL_KEY = 'ftj-referral-code';

export function useReferralTracker() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.length > 5) {
      localStorage.setItem(REFERRAL_KEY, ref);
    }
  }, [searchParams]);
}

export function getStoredReferral(): string | null {
  return localStorage.getItem(REFERRAL_KEY);
}

export function clearStoredReferral() {
  localStorage.removeItem(REFERRAL_KEY);
}
