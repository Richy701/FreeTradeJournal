import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Follows the app's light/dark class so sonner's richColors palettes and its
// own chrome (close button, action buttons) match the active theme. Colors
// come entirely from richColors — do not reintroduce bg/text overrides here,
// they win over the per-type success/error styling and flatten every toast.
const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return <Sonner theme={theme as ToasterProps["theme"]} {...props} />
}

export { Toaster }
