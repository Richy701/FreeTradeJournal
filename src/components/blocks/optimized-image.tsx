import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  width,
  height
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative", className)}>
      {/* Blur placeholder while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/40 animate-pulse rounded-lg" />
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded-lg">
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">Image not available</p>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};