"use client";

import React from "react";
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
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
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
                  src={logo.url}
                  alt={logo.name}
                  className={cn(
                    "h-16 w-auto max-w-[180px] opacity-95 hover:opacity-100 transition-all object-contain",
                    logo.name === "FundingPips" && "dark:brightness-0 dark:invert",
                    logo.name === "The5ers" && "brightness-0 dark:brightness-100",
                    logo.name === "FTMO" && "dark:brightness-0 dark:invert"
                  )}
                  onError={(e) => {
                    console.log(`Failed to load logo: ${logo.url}`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className={cn("text-lg font-bold opacity-60 hover:opacity-100 transition-opacity", logo.className)}>
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