import { useState } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { getOnboardingRedirect } from '@/utils/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import {
  faEye, faEyeSlash, faSpinner, faChartLine,
  faBrain, faShieldAlt, faChartPie, faBookOpen, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formAnimation, setFormAnimation] = useState('');

  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only use the 'from' path if it's not a protected route, otherwise check onboarding
  const isFromProtectedRoute = location.state?.from?.pathname &&
    ['/dashboard', '/trades', '/settings'].includes(location.state.from.pathname);

  const getRedirectPath = (userId: string | null = null) => {
    if (isFromProtectedRoute) {
      return getOnboardingRedirect(userId);
    }
    return location.state?.from?.pathname || getOnboardingRedirect(userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setFormAnimation('animate-pulse');

    try {
      const user = await signIn(email, password);
      setFormAnimation('animate-bounce');
      setTimeout(() => {
        navigate(getRedirectPath(user.uid), { replace: true });
      }, 300);
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setFormAnimation('animate-in slide-in-from-left-2 duration-300');
      setTimeout(() => setFormAnimation(''), 300);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const user = await signInWithGoogle();
      navigate(getRedirectPath(user.uid), { replace: true });
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };


  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setError('');
    setResetLoading(true);
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const features = [
    { icon: faChartPie, title: 'Performance Analytics', desc: 'Track P&L, win rate, and key metrics' },
    { icon: faBrain, title: 'AI Trade Coaching', desc: 'Get personalized insights on your trades' },
    { icon: faBookOpen, title: 'Trading Journal', desc: 'Document setups, emotions, and lessons' },
    { icon: faShieldAlt, title: 'Risk Management', desc: 'Set rules and monitor your discipline' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-card">

        {/* Left Panel - Branding & Features (desktop only) */}
        <div
          className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 bg-gradient-to-br from-amber-600 to-amber-500"
        >
          {/* Logo & tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">FreeTradeJournal</span>
            </div>
            <div className="space-y-2 mt-8">
              <h2 className="font-display text-3xl font-bold text-white leading-tight">
                Welcome back,<br />trader.
              </h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs">
                Sign in to access your journal, track your performance, and keep improving.
              </p>
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-5 my-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={feature.icon} className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-white/20">
            <p className="text-white/90 text-sm font-medium">Free forever. No credit card required.</p>
            <p className="text-white/60 text-xs mt-1">Join thousands of traders improving their performance.</p>
          </div>
        </div>

        {/* Right Panel - Sign In Form */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          {/* Mobile-only branded header */}
          <div className="lg:hidden -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 px-6 py-6 sm:px-8 sm:py-8 bg-gradient-to-br from-amber-600 to-amber-500 rounded-t-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">FreeTradeJournal</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">Welcome back, trader.</h1>
            <p className="text-white/80 text-sm mt-1">Free forever. No credit card required.</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block space-y-1 mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground/85 text-sm">Enter your credentials to access your trading journal</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {resetEmailSent && (
            <Alert className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <AlertDescription className="font-medium">
                Password reset email sent! Check your inbox for instructions.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className={`space-y-4 ${formAnimation}`}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                spellCheck={false}
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password…"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
              >
                {resetLoading && <FontAwesomeIcon icon={faSpinner} className="h-3 w-3 animate-spin" />}
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 !mt-6 relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-black font-semibold"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
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
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  Connecting...
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGoogle} className="mr-2 h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>

          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
