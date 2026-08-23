// Round axis ticks for money charts. Recharts divides the raw domain evenly,
// which lands labels on values like $828 and $1.7k; this picks a step of 1, 2
// or 5 (times a power of ten) so ticks read $0, $1k, $2k, $3k. The top is
// padded up to the next tick; the bottom follows the real low (plus a little
// air) so a small dip below zero doesn't cost a whole empty band.
export type NiceAxis = { ticks: number[]; domain: [number, number] }

export function niceAxis(min: number, max: number, target = 5): NiceAxis {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  const span = hi - lo
  if (span <= 0) return { ticks: [0], domain: [0, 1] }
  const rough = span / Math.max(1, target - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const bottom = lo < 0 ? lo - span * 0.04 : 0
  const top = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = Math.ceil(bottom / step) * step; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { ticks, domain: [bottom, top] }
}

// Symmetric variant for horizontal bar charts where losses extend left of
// zero: both ends snap to a tick so the zero line sits on the grid.
export function niceAxisBoth(min: number, max: number, target = 5): NiceAxis {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  const span = hi - lo
  if (span <= 0) return { ticks: [0], domain: [0, 1] }
  const rough = span / Math.max(1, target - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const bottom = Math.floor(lo / step) * step
  const top = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = bottom; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { ticks, domain: [bottom, top] }
}
