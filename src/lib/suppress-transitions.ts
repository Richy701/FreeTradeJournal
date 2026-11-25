// Theme/mode switches change CSS variables everywhere at once, but elements
// with `transition-colors` (buttons, menu items, the account switcher...) then
// fade 150ms behind the rest of the page, so the switch lands in stages.
// Disable all transitions for the frames the switch takes, then restore them
// so hover fades keep working. Same approach as next-themes'
// disableTransitionOnChange.
export function suppressTransitionsBriefly(): void {
  if (typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)
  // Force a style recalc so the rule is active before the new colors apply
  void window.getComputedStyle(document.body).transition
  // Two frames: dark-mode toggles apply the preset's inline vars one render
  // after the class flips, and both must land without a fade.
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
}
