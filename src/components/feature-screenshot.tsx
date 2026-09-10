import { useState } from 'react';
import { ArrowsOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { cn } from '@/lib/utils';

/** Consistent preview framing; the original screenshot is available at full size. */
export function FeatureScreenshot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="ghost" aria-label={`Enlarge screenshot: ${alt}`} onClick={() => setOpen(true)} className={cn('group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-none bg-muted/30 p-3 hover:bg-muted/50 sm:h-72 sm:p-4', className)}>
      <img src={src} alt={alt} loading="lazy" className="block h-auto max-h-full w-auto max-w-full rounded-md object-contain" />
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-md border bg-background/95 px-2 py-1 text-xs font-medium shadow-sm"><ArrowsOut aria-hidden="true" />Enlarge</span>
    </Button>
    <ImageLightbox open={open} onOpenChange={setOpen} src={src} alt={alt} title="Feature screenshot" />
  </>;
}
