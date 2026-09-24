import { useEffect } from 'react';

// Injects one JSON-LD block into <head> for the lifetime of the page and
// removes it on unmount, so a client-side navigation between two blog posts
// never leaves the previous post's schema behind. The prerender captures the
// head after render, so the block ships in the static HTML too.
export function JsonLd({ id, data }: { id: string; data: Record<string, unknown> }) {
  const json = JSON.stringify(data);

  useEffect(() => {
    document.getElementById(id)?.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = json;
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, json]);

  return null;
}
