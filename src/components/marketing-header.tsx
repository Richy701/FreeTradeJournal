import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';

// Header for the public marketing / SEO pages (affiliate, reviews, the
// "-alternative" and "-journal" landers, calculator). One implementation
// instead of the fifteen copies these pages used to carry, and it knows who
// is looking:
//   signed out      → Pricing · Sign In
//   signed in, free → Pricing · Dashboard
//   signed in, Pro  → Dashboard
// While a returning user's session is still resolving we show nothing on the
// right except the theme toggle, so the header does not flip Sign In →
// Dashboard a moment after paint (same session hint pro-context uses).
export function MarketingHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, loading, hadSession, isDemo } = useAuth();
  const { isPro } = useProStatus();
  const resolving = loading && hadSession && !isDemo;
  const signedIn = !!user;

  const linkClass = 'text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-2 rounded-md text-sm';

  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-50' : 'relative z-50 border-b border-border/60 bg-background'} style={{ paddingTop: 'var(--pwa-safe-top, 0px)' }}>
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img src="/favicon.svg" alt="FTJ" className="h-9 w-9 shrink-0 rounded-[12%]" />
          <span className="hidden min-[400px]:inline text-base font-bold tracking-tight sm:text-xl">FreeTradeJournal</span>
        </Link>
        <nav aria-label="Main navigation" className="flex max-w-full flex-wrap items-center gap-1 sm:gap-5">
          <Link to="/#features" className={`${linkClass} hidden md:block`}>Explore</Link>
          {!resolving && !(signedIn && isPro) && (
            <Link to="/pricing" className={linkClass}>Pricing</Link>
          )}
          {!resolving && (
            signedIn
              ? <Link to="/dashboard" className={linkClass}>Dashboard</Link>
              : <Link to="/login" className={linkClass}>Sign in</Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
