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

      {isInView && (
        <img
          src={src}
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
      )}
    </div>
  )
}
