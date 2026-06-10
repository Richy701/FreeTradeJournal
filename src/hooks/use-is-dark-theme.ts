import { useEffect, useState } from 'react'

// Determines whether the app's *effective* theme is dark by reading the rendered
// `--background` lightness. This is more reliable than checking the `dark` class:
// color presets (e.g. Navy) override `--background` via inline style without
// toggling the class, so a class check would mis-detect the theme.
function detectDark(): boolean {
  if (typeof document === 'undefined') return true
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
  // Format is space-separated HSL, e.g. "221 56% 10%" — the 3rd token is lightness.
  const lightness = parseFloat(bg.split(/\s+/)[2])
  if (!Number.isNaN(lightness)) return lightness < 50
  return document.documentElement.classList.contains('dark')
}

export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(detectDark)

  useEffect(() => {
    const update = () => setIsDark(detectDark())
    update()
    // Watch both `class` (light/dark toggle) and `style` (preset overrides).
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
