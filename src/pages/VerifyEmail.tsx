import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faSpinner, faCheck, faRotateRight } from '@fortawesome/free-solid-svg-icons';

export default function VerifyEmail() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Poll for verification every 3 seconds
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          setVerified(true);
          clearInterval(interval);
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
        }
      } catch {
        // ignore reload errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!user || resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fns = getFunctions();
      const sendVerification = httpsCallable(fns, 'sendEmailVerificationLink');
      await sendVerification();
      setResendCooldown(60);
    } catch {
      // silently fail — user can try again
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = async () => {
    await logout();
    navigate('/signup', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 p-8 rounded-2xl border border-border bg-card shadow-2xl">

        {verified ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="h-7 w-7 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Email verified</h1>
              <p className="text-muted-foreground mt-1 text-sm">Taking you to your journal...</p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faEnvelope} className="h-7 w-7 text-amber-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="text-muted-foreground text-sm">
                We sent a verification link to{' '}
                <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Click the link to verify your email and access your journal.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <FontAwesomeIcon icon={faRotateRight} className="mr-2 h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Wrong email?{' '}
                <button
                  onClick={handleGoBack}
                  className="text-amber-500 hover:underline"
                >
                  Go back to sign up
                </button>
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
