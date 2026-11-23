import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { House } from '@phosphor-icons/react';
import { SEOMeta } from '@/components/seo-meta';
import { MarketingHeader } from '@/components/marketing-header';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
      <GeometricBackdrop />
      {/* Unknown URLs are served the app shell with a 200 by the Vercel SPA
          rewrite, so this page marks itself noindex to stop Google filing
          them as duplicates of the homepage. */}
      <SEOMeta title="Page not found | FreeTradeJournal" description="That page does not exist or has moved." noindex />
      <div className="relative z-10 mx-auto max-w-lg space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Head back to the homepage to get started.
        </p>
        <Button asChild size="lg">
          <Link to="/">
            <House className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      </main>
    </div>
  );
}
