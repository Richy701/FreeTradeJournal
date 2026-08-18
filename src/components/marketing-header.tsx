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
export function MarketingHeader() {
  const { user, loading, hadSession, isDemo } = useAuth();
  const { isPro } = useProStatus();
  const resolving = loading && hadSession && !isDemo;
  const signedIn = !!user;

  const linkClass = 'text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base';

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
          <span className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">FreeTradeJournal</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {!resolving && !(signedIn && isPro) && (
            <Link to="/pricing" className={`${linkClass} hidden sm:block`}>Pricing</Link>
          )}
          {!resolving && (
            signedIn
              ? <Link to="/dashboard" className={linkClass}>Dashboard</Link>
              : <Link to="/login" className={linkClass}>Sign In</Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
