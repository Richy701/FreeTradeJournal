import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpinnerGap, Envelope, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      panelTitle="Reset your password"
      panelSubtitle="Enter the email linked to your account and we'll send you a reset link."
      mobileTitle="Reset your password"
      mobileSubtitle="We'll send a reset link to your inbox."
    >
      {/* Desktop heading */}
      <div className="hidden lg:block space-y-1 mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-muted-foreground/85 text-sm">Enter your email and we'll send you a reset link.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-300">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {sent ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Check your inbox</p>
              <p className="text-sm text-muted-foreground">
                We sent a reset link to <span className="font-medium text-foreground">{email}</span>. It may take a minute to arrive.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => { setSent(false); setEmail(''); }}
          >
            Send to a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                spellCheck={false}
                autoComplete="email"
                className="h-11 pl-9"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
