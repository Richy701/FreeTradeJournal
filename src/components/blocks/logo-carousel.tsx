"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Logo {
  name: string;
  url?: string;
  className?: string;
  /** Per-logo <img> size/treatment overrides (e.g. "h-12", "h-[72px]") */
  imgClassName?: string;
}

interface LogoCarouselProps {
  logos: Logo[];
  className?: string;
}

export function LogoCarousel({ logos, className }: LogoCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogos = () => {
      const lazyImages = carouselRef.current?.querySelectorAll('.logo-lazy[data-src]');
      lazyImages?.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        const newImg = new Image();
        newImg.onload = () => {
          imgElement.src = imgElement.dataset.src || '';
          imgElement.removeAttribute('data-src');
          imgElement.classList.remove('logo-lazy');
        };
        newImg.src = imgElement.dataset.src || '';
      });
    };

    const el = carouselRef.current;
    if (!el) return;

    // Use IntersectionObserver to load logos when scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadLogos();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={carouselRef}
      className={cn(
        "group relative w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className
      )}
    >
      <div className="relative flex overflow-hidden py-8">
        {/* No flex gap: uniform per-item margins keep both halves exactly equal
            so the -50% marquee translate loops without a visible seam. */}
        <div className="flex items-center whitespace-nowrap animate-marquee will-change-transform motion-reduce:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
          {[...logos, ...logos].map((logo, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center flex-shrink-0 mx-10"
            >
              {logo.url ? (
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='64'%3E%3Crect width='180' height='64' fill='%23f3f4f6'/%3E%3C/svg%3E"
                  data-src={logo.url}
                  alt={logo.name}
                  width="180"
                  height="64"
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    // Assets are the brands' white/dark-bg variants: shown as-is
                    // in dark mode, flattened to black for light mode.
                    "h-16 w-auto max-w-[200px] opacity-60 hover:opacity-100 transition-opacity duration-300 object-contain logo-lazy brightness-0 dark:brightness-100",
                    logo.imgClassName
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className={cn("text-lg font-bold opacity-50 hover:opacity-80 transition-opacity duration-300", logo.className)}>
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
