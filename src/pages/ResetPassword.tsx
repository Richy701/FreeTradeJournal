import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpinnerGap, Eye, EyeSlash, Check, CheckCircle, ArrowLeft, Warning } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/auth-layout';

type PageState = 'verifying' | 'ready' | 'invalid' | 'success' | 'emailVerified';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode') ?? '';
  const mode = searchParams.get('mode') ?? '';

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { verifyPasswordResetCode, confirmPasswordReset, applyActionCode, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!oobCode) {
      setPageState('invalid');
      return;
    }

    if (mode === 'verifyEmail') {
      applyActionCode(oobCode)
        .then(() => {
          setPageState('emailVerified');
          // If this tab already has a session, sync the fresh emailVerified
          // flag into context so route guards don't bounce on a stale copy
          refreshUser().catch(() => {});
        })
        .catch(() => setPageState('invalid'));
      return;
    }

    verifyPasswordResetCode(oobCode)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setPageState('ready');
      })
      .catch(() => {
        setPageState('invalid');
      });
  }, [oobCode, mode]);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /\d/.test(password) },
  ];
  const isPasswordValid = passwordRequirements.every((r) => r.met);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(oobCode, password);
      setPageState('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      panelTitle="Create a new password"
      panelSubtitle="Choose a strong password to secure your trading journal."
      mobileTitle="Create a new password"
      mobileSubtitle="Choose something strong and memorable."
    >
          {/* Desktop heading */}
          <div className="hidden lg:block space-y-1 mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">Set new password</h1>
            {email && (
              <p className="text-muted-foreground/85 text-sm">
                For <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
          </div>

          {/* Verifying state */}
          {pageState === 'verifying' && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <SpinnerGap className="h-6 w-6 animate-spin" />
              <p className="text-sm">Verifying your reset link...</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {pageState === 'invalid' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Warning className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Link expired or invalid</p>
                  <p className="text-sm text-muted-foreground">
                    This reset link has expired or already been used. Request a new one below.
                  </p>
                </div>
              </div>
              <Link to="/forgot-password">
                <Button className="w-full h-11">Request a new reset link</Button>
              </Link>
            </div>
          )}

          {/* Email verified */}
          {pageState === 'emailVerified' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Email verified</p>
                  <p className="text-sm text-muted-foreground">
                    Your email address has been confirmed. You can now sign in.
                  </p>
                </div>
              </div>
              <Button className="w-full h-11" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          )}

          {/* Password reset success */}
          {pageState === 'success' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Password updated</p>
                  <p className="text-sm text-muted-foreground">
                    Your password has been reset. Sign in with your new password.
                  </p>
                </div>
              </div>
              <Button className="w-full h-11" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          )}

          {/* Form */}
          {pageState === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {password && (
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
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !isPasswordValid || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Set new password'
                )}
              </Button>
            </form>
          )}

          {pageState !== 'success' && pageState !== 'emailVerified' && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </div>
          )}
    </AuthLayout>
  );
}
