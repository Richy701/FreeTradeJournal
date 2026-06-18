import { useEffect, useState } from 'react';
import { isImageRef, isCloudRef, resolveImageRef } from '@/utils/image-store';

interface StoredImageProps {
  /** An `idb:<id>` / `fb:<path>` reference, or an inline `data:`/URL string. */
  src: string;
  alt?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

/**
 * Renders a journal screenshot, transparently resolving `idb:<id>` (IndexedDB)
 * and `fb:<path>` (Firebase Storage) references. Inline `data:` URLs render
 * directly.
 */
export function StoredImage({ src, alt, className, onClick }: StoredImageProps) {
  const needsResolve = isImageRef(src) || isCloudRef(src);
  const [resolved, setResolved] = useState<string | null>(() =>
    needsResolve ? null : src
  );

  useEffect(() => {
    let active = true;
    if (isImageRef(src) || isCloudRef(src)) {
      setResolved(null);
      resolveImageRef(src).then((url) => {
        if (active) setResolved(url);
      });
    } else {
      setResolved(src);
    }
    return () => {
      active = false;
    };
  }, [src]);

  if (!resolved) {
    return <div className={className} aria-hidden="true" />;
  }

  return <img src={resolved} alt={alt} className={className} onClick={onClick} />;
}
