import { useState, useRef, useEffect } from 'react'

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
  width?: number
  height?: number
}

export function ResponsiveImage({ src, alt, className = '', priority = false, width, height }: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="w-full aspect-video bg-muted/20 animate-pulse rounded-2xl" />
      )}

      {isInView && (() => {
        // Build srcSet from responsive variants (e.g. foo.webp → foo-640w.webp, foo-1280w.webp)
        const ext = src.substring(src.lastIndexOf('.'))
        const base = src.substring(0, src.lastIndexOf('.'))
        const srcSet = `${base}-640w${ext} 640w, ${base}-1280w${ext} 1280w, ${src} 1920w`

        return (
          <img
            src={src}
            srcSet={srcSet}
            sizes="(max-width: 640px) 640px, (max-width: 1280px) 1280px, 1920px"
            alt={alt}
            width={width}
            height={height}
            className={`w-full aspect-video object-contain rounded-2xl transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )
      })()}
    </div>
  )
}
