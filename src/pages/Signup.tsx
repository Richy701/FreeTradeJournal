import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { clearOnboardingData } from '@/utils/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import {
  faEye, faEyeSlash, faCheck, faChartLine, faSpinner,
  faBrain, faShieldAlt, faChartPie, faBookOpen, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formAnimation, setFormAnimation] = useState('');

  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { label: 'Contains number', met: /\d/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

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

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setFormAnimation('animate-pulse');

    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      const user = await signUp(formData.email, formData.password, displayName);

      clearOnboardingData(user.uid);
      setFormAnimation('animate-bounce');
      setTimeout(() => {
        navigate('/onboarding');
      }, 300);
    } catch (error: any) {
      let errorMessage = 'Failed to create account';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
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

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      navigate('/onboarding');
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google');
    } finally {
      setGoogleLoading(false);
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
          className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 bg-gradient-to-br from-amber-500 to-yellow-600"
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
                Your trading edge<br />starts here.
              </h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs">
                Professional analytics, journaling, and performance tools to help you trade with confidence.
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

        {/* Right Panel - Sign Up Form */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          {/* Mobile-only logo */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-primary/10">
                <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground/85">Start your trading journal journey</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block space-y-1 mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground/85 text-sm">Fill in your details to get started</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className={`space-y-4 ${formAnimation}`}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John…"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe…"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com…"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                spellCheck={false}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password…"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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
              {formData.password && (
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className={`h-3 w-3 ${req.met ? 'text-green-500' : 'text-muted-foreground'}`}
                      />
                      <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password…"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="h-4 w-4" />
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={`h-3 w-3 ${passwordsMatch ? 'text-green-500' : 'text-muted-foreground'}`}
                  />
                  <span className={passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    Passwords match
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 justify-center">
              <Checkbox
                id="terms"
                className="mt-0.5 size-4 min-h-4 min-w-4"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-snug">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 !mt-6 relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-black font-semibold"
              disabled={loading || googleLoading || !isPasswordValid || !passwordsMatch || !agreedToTerms}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create account
                  <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                </div>
              )}
            </Button>
          </form>

          <div className="space-y-4 mt-4">
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
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
