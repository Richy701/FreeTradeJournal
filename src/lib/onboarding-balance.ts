/** Preserve the entered amount; never substitute a balance for invalid input. */
export function parseOnboardingBalance(raw: string): number | null {
  const value = raw.trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return null
  const balance = Number(value)
  return Number.isFinite(balance) ? balance : null
}
