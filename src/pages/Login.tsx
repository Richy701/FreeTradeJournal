import { useEffect, useState } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { clearOnboardingData } from '@/utils/onboarding';

import { trackEvent } from '@/lib/analytics';
import { googleAuthErrorMessage } from '@/lib/auth-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeSlash, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { GoogleIcon } from '@/components/ui/brand-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout, PanelAccent } from '@/components/auth/auth-layout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, isDemo, signIn, signInWithGoogle } = useAuth();

  // Warm the Firebase Auth chunks on mount. signInWithPopup must open its
  // popup within the click's user-activation window (~1s in Chrome, stricter
  // in Safari); a cold-cache chunk download between click and popup blew past
  // it, which is half of the "first Google click does nothing" bug. With the
  // modules cached, the popup opens synchronously enough to survive.
  useEffect(() => {
    void import('firebase/auth');
    void import('@/lib/firebase-lazy').then((m) => m.getFirebaseAuth());
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  // Already signed in (and not just browsing in demo mode): skip the form.
  // Guarded on the in-flight flags so the sign-in handlers keep control of
  // where a fresh sign-in lands (a new Google user goes to onboarding).
  useEffect(() => {
    if (user && !isDemo && !loading && !googleLoading) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, isDemo, loading, googleLoading, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      trackEvent('login_completed');
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      let errorMessage = 'Something went wrong signing you in. Please try again.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Check your connection and try again.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { user: googleUser, isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        trackEvent('signup_completed');
        clearOnboardingData(googleUser.uid);
        navigate('/onboarding', { replace: true });
      } else {
        trackEvent('login_completed');
        navigate(redirectPath, { replace: true });
      }
    } catch (error: any) {
      const message = googleAuthErrorMessage(error);
      if (message) setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      panelTitle={<>Welcome back,<br /><PanelAccent>trader.</PanelAccent></>}
      panelSubtitle="Pick up where you left off. Your trades, journal, and stats are all here."
      mobileTitle={<>Welcome back, <PanelAccent>trader.</PanelAccent></>}
      mobileSubtitle="Free forever. No credit card required."
      showFeatures
    >
      {/* Desktop heading */}
      <div className="hidden lg:block space-y-1 mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground/85 text-sm">Use the email you signed up with.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-300">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            spellCheck={false}
            autoComplete="email"
            className="h-11 bg-background/60 border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 pr-10 bg-background/60 border-border/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-amber-700 dark:text-amber-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 !mt-6 font-semibold"
          disabled={loading || googleLoading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <SpinnerGap className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign in</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          )}
        </Button>
      </form>

      <div className="space-y-3 mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full h-11 relative"
        >
          {googleLoading ? (
            <div className="flex items-center gap-2">
              <SpinnerGap className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            <>
              <GoogleIcon className="mr-2 h-4 w-4" />
              <span>Continue with Google</span>
            </>
          )}
        </Button>

      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <span>Don't have an account? </span>
        <Link to="/signup" className="text-amber-700 dark:text-amber-500 hover:underline font-medium">
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground mt-4">
        <span>By signing in, you agree to our </span>
        <Link to="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>
        <span> and </span>
        <Link to="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </AuthLayout>
  );
}
