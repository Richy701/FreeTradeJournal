import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { trackEvent } from '@/lib/analytics';

// Outbound partner links fire the same event as the in-app deal banners, so
// one PostHog insight shows every route to a partner site.
function trackOutbound(href: string) {
  let partner = href;
  try {
    partner = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    // leave the raw href as the partner label
  }
  trackEvent('affiliate_link_clicked', {
    source: 'closing_cta',
    partner,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

// The block that closes every marketing page before its FAQ: one plain
// heading, one line, a standard primary button and an optional outline button,
// then the related pages as quiet text links. Replaced the amber-tinted box
// with the shimmering gradient button (Sep 2026).
interface ClosingCtaProps {
  title: string;
  subtitle: ReactNode;
  primary: { label: string; to?: string; href?: string };
  secondary?: { label: string; href: string };
  related?: { label: string; to: string }[];
}

export function ClosingCta({ title, subtitle, primary, secondary, related = [] }: ClosingCtaProps) {
  return (
    <>
      <Separator className="mt-20" />
      <div className="mx-auto max-w-xl pt-14 text-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            {primary.href ? (
              <a href={primary.href} target="_blank" rel="noopener noreferrer sponsored" onClick={() => trackOutbound(primary.href!)}>
                {primary.label}
                <ArrowSquareOut className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <Link to={primary.to ?? '/signup'}>
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </Button>
          {secondary && (
            <Button asChild variant="outline" size="lg">
              <a href={secondary.href} target="_blank" rel="noopener noreferrer sponsored" onClick={() => trackOutbound(secondary.href)}>
                {secondary.label}
                <ArrowSquareOut className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        {related.length > 0 && (
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {related.map((link) => (
              <Link key={link.to} to={link.to} className="underline-offset-4 hover:text-foreground hover:underline">
                {link.label}
              </Link>
            ))}
          </p>
        )}
      </div>
    </>
  );
}
