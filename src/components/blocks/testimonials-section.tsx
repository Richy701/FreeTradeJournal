import { useEffect, useState } from 'react';
import { Quotes, Star } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { posthog } from '@/lib/posthog';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
}

// Fallback testimonials shown before any are approved in Firestore
const FALLBACK_TESTIMONIALS: Testimonial[] = [];

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTestimonials() {
      try {
        const { getFirestore, collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
        const { getFirebaseFirestore } = await import('@/lib/firebase-lazy');
        const db = await getFirebaseFirestore();
        const q = query(
          collection(db, 'testimonials'),
          where('approved', '==', true),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial));
        // Grid rows stretch to the tallest card, so a one-liner next to a long
        // review becomes mostly empty space. Pair similar lengths per row.
        docs.sort((a, b) => (b.quote?.length ?? 0) - (a.quote?.length ?? 0));
        setTestimonials(docs.length > 0 ? docs : FALLBACK_TESTIMONIALS);
      } catch (err) {
        // A silent failure here hid the section from every visitor for months
        // (missing composite index) — keep the graceful fallback but report it.
        console.error('Testimonials fetch failed:', err);
        posthog.captureException(err instanceof Error ? err : new Error(String(err)), {
          source: 'testimonials-section',
        });
        if (!cancelled) setTestimonials(FALLBACK_TESTIMONIALS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTestimonials();
    return () => { cancelled = true; };
  }, []);

  if (loading || testimonials.length === 0) return null;

  const rated = testimonials.filter((t) => t.rating > 0);
  const averageRating = rated.length ? rated.reduce((sum, t) => sum + t.rating, 0) / rated.length : null;

  return (
    <section className="w-full py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header — the average is computed from the reviews shown, never typed in */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-600 dark:text-amber-500">Reviews</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What traders say{' '}
            <span className="text-amber-600 dark:text-amber-500">after using it</span>
          </h2>
          {averageRating !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} weight="fill" className={cn('h-4 w-4', s <= Math.round(averageRating) ? 'text-amber-500' : 'text-muted-foreground/25')} />
                ))}
              </span>
              <span>
                <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span> out of 5 from traders who left a review
              </span>
            </div>
          )}
          <p className="mx-auto max-w-xl text-muted-foreground">
            Written by people who journal their trades here. The words and ratings are their own.
          </p>
        </div>

        {/* Grid — 4 reviews orphan badly in a 3-column grid, so give them a 2x2 */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-5",
          testimonials.length === 4 ? "max-w-4xl mx-auto w-full" : "lg:grid-cols-3"
        )}>
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="flex flex-col transition-colors duration-200 hover:border-amber-500/30">
      <CardContent className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
      {/* Stars */}
      {testimonial.rating > 0 && (
        <div className="flex gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              weight="fill"
              className={cn(
                "h-4 w-4",
                s <= testimonial.rating ? "text-amber-500" : "text-muted-foreground/25"
              )}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <div className="flex-1 flex flex-col gap-2">
        <Quotes weight="fill" className="h-6 w-6 text-amber-500/40" aria-hidden="true" />
        <p className="text-base leading-7 text-foreground/90">
          {testimonial.quote}
        </p>
      </div>

      </CardContent>

      {/* Author */}
      <CardFooter className="border-t border-border/60 p-3 sm:p-4">
        <Item size="sm" className="w-full px-3 py-1">
          <ItemMedia>
            <Avatar className="h-9 w-9 border border-amber-500/20">
              <AvatarFallback className="bg-amber-500/15 text-sm font-semibold text-amber-600 dark:text-amber-400">
                {testimonial.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{testimonial.name}</ItemTitle>
            {testimonial.role && <ItemDescription className="text-xs">{testimonial.role}</ItemDescription>}
          </ItemContent>
        </Item>
      </CardFooter>
    </Card>
  );
}
