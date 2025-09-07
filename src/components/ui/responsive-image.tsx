import { useState, useRef, useEffect } from 'react'

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function ResponsiveImage({ src, alt, className = '', priority = false }: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  // Generate responsive WebP source set with proper filename handling
  const generateSrcSet = (originalSrc: string) => {
    const extension = originalSrc.split('.').pop()
    const basePath = originalSrc.replace(`.${extension}`, '').replace(/\s+/g, '_')
    
    return [
      `${basePath}-380w.webp 380w`,
      `${basePath}-768w.webp 768w`, 
      `${basePath}-1200w.webp 1200w`
    ].join(', ')
  }

  const getOptimizedSrc = (originalSrc: string) => {
    const extension = originalSrc.split('.').pop()
    const basePath = originalSrc.replace(`.${extension}`, '').replace(/\s+/g, '_')
    return `${basePath}-768w.webp`
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="w-full aspect-video bg-muted/20 animate-pulse rounded-2xl" />
      )}
      
      {/* Lazy load optimized image with WebP support */}
      {isInView && (
        <picture>
          <source
            srcSet={generateSrcSet(src)}
            sizes="(max-width: 640px) 380px, (max-width: 1024px) 768px, 1200px"
            type="image/webp"
          />
          <img
            src={getOptimizedSrc(src)}
            alt={alt}
            className={`w-full aspect-video object-contain rounded-2xl transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={(e) => {
              // Fallback to original image if WebP fails
              (e.target as HTMLImageElement).src = src;
            }}
          />
        </picture>
      )}
    </div>
  )
}