import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

type ImageLightboxProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Image to show. Omit and pass `children` to render a custom image element (e.g. StoredImage). */
  src?: string
  alt?: string
  /** Accessible name for the dialog; falls back to `alt`. */
  title?: string
  className?: string
  children?: React.ReactNode
}

// Full-screen image viewer built on the Dialog primitive so it gets focus
// trapping, Escape-to-close and click-outside for free.
function ImageLightbox({ open, onOpenChange, src, alt = "", title, className, children }: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
          )}
          onClick={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">{title ?? alt ?? "Image"}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Press Escape or click outside the image to close.</DialogPrimitive.Description>
          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {children ?? (
              <img src={src} alt={alt} className="max-h-[90vh] max-w-full object-contain rounded-xl shadow-2xl" />
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-5 w-5" weight="bold" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { ImageLightbox }
