"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Logo {
  name: string;
  url?: string;
  className?: string;
  style?: string;
}

interface LogoCarouselProps {
  logos: Logo[];
  className?: string;
}

export function LogoCarousel({ logos, className }: LogoCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for critical resources to load before loading logos
    const loadLogos = () => {
      const lazyImages = carouselRef.current?.querySelectorAll('.logo-lazy[data-src]');
      lazyImages?.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        const newImg = new Image();
        newImg.onload = () => {
          imgElement.src = imgElement.dataset.src || '';
          imgElement.removeAttribute('data-src');
          imgElement.classList.remove('logo-lazy');
          imgElement.style.opacity = '0.5';
        };
        newImg.src = imgElement.dataset.src || '';
      });
    };

    // Defer logo loading until after initial render and critical resources
    const timer = setTimeout(() => {
      if (document.readyState === 'complete') {
        loadLogos();
      } else {
        window.addEventListener('load', loadLogos, { once: true });
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', loadLogos);
    };
  }, []);

  return (
    <div ref={carouselRef} className={cn("relative w-full overflow-hidden", className)}>
      <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />
      
      <div className="relative flex overflow-hidden py-8">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee will-change-transform">
          {[...logos, ...logos].map((logo, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center flex-shrink-0 mx-4"
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
                    "h-16 w-auto max-w-[180px] opacity-50 hover:opacity-80 transition-opacity duration-300 object-contain logo-lazy",
                    logo.name === "FundingPips" && "dark:brightness-0 dark:invert",
                    logo.name === "The5ers" && "brightness-0 dark:brightness-100",
                    logo.name === "FTMO" && "dark:brightness-0 dark:invert"
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