import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faSpinner, faEnvelope, faArrowLeft, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-card">

        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 bg-gradient-to-br from-amber-600 to-amber-500">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <FontAwesomeIcon icon={faChartLine} className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">FreeTradeJournal</span>
            </div>
            <div className="mt-8 space-y-2">
              <h2 className="font-display text-3xl font-bold text-white leading-tight">
                Reset your password
              </h2>
              <p className="text-white/80 text-base">
                Enter the email linked to your account and we'll send you a reset link.
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-white/20">
            <p className="text-white/90 text-sm font-medium">Free forever. No credit card required.</p>
            <p className="text-white/60 text-xs mt-1">Join thousands of traders improving their performance.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">

          {/* Mobile header */}
          <div className="lg:hidden -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 px-6 py-6 sm:px-8 sm:py-8 bg-gradient-to-br from-amber-600 to-amber-500 rounded-t-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">FreeTradeJournal</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">Reset your password</h1>
            <p className="text-white/80 text-sm mt-1">We'll send a reset link to your inbox.</p>
          </div>

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
                  <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />
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
              <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
