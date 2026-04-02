import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        setTestimonials(docs.length > 0 ? docs : FALLBACK_TESTIMONIALS);
      } catch {
        if (!cancelled) setTestimonials(FALLBACK_TESTIMONIALS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTestimonials();
    return () => { cancelled = true; };
  }, []);

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="w-full py-16 sm:py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm font-medium text-amber-500 uppercase tracking-widest">Traders love it</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Real results from{' '}
            <span className="text-amber-500">real traders</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of traders who use FreeTradeJournal to build consistency and find their edge.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className={cn(
      "flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-card/50",
      "hover:border-border hover:bg-card transition-colors duration-200"
    )}>
      {/* Stars */}
      {testimonial.rating > 0 && (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-4 w-4",
                s <= testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/20"
              )}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <p className="text-sm leading-relaxed text-foreground/80 flex-1">
        "{testimonial.quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/40">
        <div className="h-8 w-8 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {testimonial.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">{testimonial.name}</span>
          {testimonial.role && (
            <span className="text-xs text-muted-foreground truncate">{testimonial.role}</span>
          )}
        </div>
      </div>
    </div>
  );
}
