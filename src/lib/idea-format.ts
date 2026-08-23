// Number formatting shared by the Trade Ideas cards and dialogs.

export function formatIdeaPrice(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 5 })
}

export function formatOutcomePnl(pnl: number, currency: string): string {
  const abs = Math.abs(pnl)
  let body: string
  try {
    body = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: abs >= 1000 ? 0 : 2 }).format(abs)
  } catch {
    body = abs.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  return `${pnl < 0 ? '-' : pnl > 0 ? '+' : ''}${body}`
}

/**
 * Parses a typed price level. "1,1045" on a comma-decimal keyboard is a
 * decimal; "19,240.50" uses the comma as a thousands separator. Returns null
 * for empty input and NaN for anything that is not a number.
 */
export function parseLevel(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const commas = (t.match(/,/g) || []).length
  // One comma, no dot: "19,240" (comma + exactly 3 digits) is a thousands
  // separator; "1,1045" or "24350,25" is a decimal comma.
  const decimalComma = commas === 1 && !t.includes('.') && !/,\d{3}$/.test(t)
  const normalised = decimalComma ? t.replace(',', '.') : t.replace(/,/g, '')
  const n = Number(normalised)
  return Number.isFinite(n) ? n : NaN
}

/** Badge text for a linked result. "Lost" rather than "Stopped out": the result comes from the P&L sign, not the stop. */
export const OUTCOME_LABELS = { win: 'Worked', loss: 'Lost', breakeven: 'Break even' } as const
