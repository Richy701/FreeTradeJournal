import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { clearOnboardingData } from '@/utils/onboarding';
import { isBadEmail } from '@/lib/email-validation';
import { trackEvent } from '@/lib/analytics';
import { googleAuthErrorMessage } from '@/lib/auth-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeSlash, Check, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { GoogleIcon } from '@/components/ui/brand-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout, PanelAccent } from '@/components/auth/auth-layout';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { user, isDemo, signUp, signInWithGoogle } = useAuth();

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

  // Already signed in (and not just browsing in demo mode): skip the form.
  // The sign-up handlers own where a fresh sign-up lands (verify-email or
  // onboarding). Guarding on the in-flight flags alone is not enough: React
  // Router wraps navigation in startTransition, so the handler's
  // setLoading(false) re-renders this page at the old location first and this
  // effect used to fire and replace /onboarding with /dashboard.
  const handlerNavigated = useRef(false);
  useEffect(() => {
    if (user && !isDemo && !loading && !googleLoading && !handlerNavigated.current) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isDemo, loading, googleLoading, navigate]);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /\d/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (isBadEmail(formData.email)) {
      setError("That email address doesn't look right. Please use a real email.");
      return;
    }

    setLoading(true);

    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      const user = await signUp(formData.email, formData.password, displayName);
      trackEvent('signup_completed');
      clearOnboardingData(user.uid);
      handlerNavigated.current = true;
      navigate('/verify-email');
    } catch (error: any) {
      let errorMessage = 'Something went wrong creating your account. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password must be at least 8 characters';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Check your connection and try again.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { user: googleUser, isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        trackEvent('signup_completed');
        clearOnboardingData(googleUser.uid);
        handlerNavigated.current = true;
        navigate('/onboarding');
      } else {
        // Existing account clicking Google here is just signing back in.
        trackEvent('login_completed');
        handlerNavigated.current = true;
        navigate('/dashboard', { replace: true });
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
      panelTitle={<>Start your<br /><PanelAccent>trading journal.</PanelAccent></>}
      panelSubtitle="Log every trade, see what's winning and losing, and keep notes on every setup."
      mobileTitle={<>Start your <PanelAccent>trading journal.</PanelAccent></>}
      mobileSubtitle="Free forever. No credit card required."
      showFeatures
    >
      {/* Desktop heading */}
      <div className="hidden lg:block space-y-1 mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground/85 text-sm">Takes about a minute. No credit card.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-300">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
              className="h-11 bg-background/60 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
              className="h-11 bg-background/60 border-border/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            spellCheck={false}
            className="h-11 bg-background/60 border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
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
          {formData.password && (() => {
            const metCount = passwordRequirements.filter(r => r.met).length;
            const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            const colors = [
              'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-amber-400', 'bg-green-500'
            ];
            const textColors = [
              'text-red-500', 'text-red-500', 'text-amber-500', 'text-amber-400', 'text-green-500'
            ];
            return (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i < metCount ? colors[metCount] : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${textColors[metCount]}`}>
                    {labels[metCount]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <Check className={`h-3 w-3 flex-shrink-0 ${req.met ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                      <span className={`text-xs ${req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            className="mt-0.5 size-4 min-h-4 min-w-4"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm leading-snug">
            {/* Text runs are wrapped so React only ever removes elements it
                created. Page translation replaces bare text nodes, and
                React then fails to remove them — crashing this label the
                moment the checkbox re-renders it. */}
            <span>I agree to the </span>
            <Link to="/terms" className="text-amber-700 dark:text-amber-500 hover:underline">Terms of Service</Link>
            <span> and </span>
            <Link to="/privacy" className="text-amber-700 dark:text-amber-500 hover:underline">Privacy Policy</Link>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-11 !mt-6 font-semibold"
          disabled={loading || googleLoading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <SpinnerGap className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Create account</span>
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
          onClick={handleGoogleSignUp}
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
        <span>Already have an account? </span>
        <Link to="/login" className="text-amber-700 dark:text-amber-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
