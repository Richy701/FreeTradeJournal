import { useEffect, useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { Clock } from '@phosphor-icons/react'

// Session hours are defined in each market's own IANA timezone, so daylight
// saving shifts are handled by Intl instead of hand-maintained UTC offsets.
interface SessionDef {
  name: string
  tz: string
  /** Local minutes-since-midnight when the session opens/closes. Negative
   *  minutes mean the previous calendar day (CME opens the evening before). */
  start: number
  end: number
  /** Close is measured in a different zone (Asia: Sydney open → Tokyo close). */
  endTz?: string
  /** Verb for the open-state countdown: "closes in" (default) or "halts in". */
  closeVerb?: string
}

// Same four buckets as the Time of Day & Sessions chart: Asia is Sydney's open
// through Tokyo's close, so both widgets describe the day the same way.
const SESSIONS: SessionDef[] = [
  { name: 'Asia', tz: 'Australia/Sydney', start: 8 * 60, end: 18 * 60, endTz: 'Asia/Tokyo' },
  { name: 'London', tz: 'Europe/London', start: 8 * 60, end: 17 * 60 },
  { name: 'New York', tz: 'America/New_York', start: 8 * 60, end: 17 * 60 },
  // CME Globex for the index/energy/metal contracts our users trade: Sunday
  // 17:00 to Friday 16:00 America/Chicago with a daily 16:00-17:00 halt, so
  // each trading day runs from 17:00 the evening before to 16:00.
  { name: 'CME futures', tz: 'America/Chicago', start: -7 * 60, end: 16 * 60, closeVerb: 'halts' },
]

// Remaining 2026 dates that close or shorten the markets our users trade.
// Shown only on the day and the day before. Verify each January.
const HOLIDAYS: { date: string; label: string; note: string }[] = [
  { date: '2026-08-31', label: 'UK Summer Bank Holiday', note: 'London markets closed' },
  { date: '2026-09-07', label: 'Labor Day', note: 'US markets closed, CME equity futures halt early' },
  { date: '2026-11-26', label: 'Thanksgiving', note: 'US markets closed, CME closes early' },
  { date: '2026-11-27', label: 'Day after Thanksgiving', note: 'US markets close early' },
  { date: '2026-12-25', label: 'Christmas Day', note: 'Markets closed' },
  { date: '2026-12-28', label: 'UK Boxing Day (substitute)', note: 'London markets closed' },
  { date: '2027-01-01', label: 'New Year\'s Day', note: 'Markets closed' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_MS = 24 * 60 * 60 * 1000

function tzParts(at: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(at)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  const hour = parseInt(get('hour'), 10) % 24
  const minute = parseInt(get('minute'), 10)
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    weekday: WEEKDAYS.indexOf(get('weekday')),
    minutes: hour * 60 + minute,
    clock: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}

// UTC instant for a wall-clock time in a timezone. One refinement pass covers
// the offset guess; only exact DST-transition hours would be off, and no
// session opens or closes inside one.
function instantForTzTime(tz: string, year: number, month: number, day: number, minutes: number): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, 0, minutes))
  for (let i = 0; i < 2; i++) {
    const p = tzParts(guess, tz)
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, 0, p.minutes)
    const offset = asUTC - guess.getTime()
    guess = new Date(Date.UTC(year, month - 1, day, 0, minutes) - offset)
  }
  return guess
}

const isTradingDay = (day: number) => day >= 1 && day <= 5

function fmtDuration(mins: number): string {
  if (mins >= 1440) {
    const d = Math.floor(mins / 1440)
    const h = Math.round((mins % 1440) / 60)
    return h === 0 ? `${d}d` : `${d}d ${h}h`
  }
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// "Mon 08:00" in the user's local time — for opens further out than a countdown
// reads well.
function fmtWhen(d: Date): string {
  return `${d.toLocaleDateString([], { weekday: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

// Session occurrences as absolute intervals near "now" (yesterday through
// three days ahead in the session's own calendar, skipping weekends) — wide
// enough that the next open is always known, even across a whole weekend.
function sessionIntervals(now: Date, s: SessionDef): { open: Date; close: Date }[] {
  const out: { open: Date; close: Date }[] = []
  const seen = new Set<number>()
  for (const offset of [-1, 0, 1, 2, 3]) {
    const ref = new Date(now.getTime() + offset * DAY_MS)
    const p = tzParts(ref, s.tz)
    if (!isTradingDay(p.weekday)) continue
    const open = instantForTzTime(s.tz, p.year, p.month, p.day, s.start)
    if (seen.has(open.getTime())) continue
    seen.add(open.getTime())
    out.push({ open, close: instantForTzTime(s.endTz || s.tz, p.year, p.month, p.day, s.end) })
  }
  return out
}

function sessionStatus(now: Date, s: SessionDef, intervals: { open: Date; close: Date }[]): { open: boolean; detail: string; nextOpen?: Date } {
  const t = now.getTime()
  for (const iv of intervals) {
    if (t >= iv.open.getTime() && t < iv.close.getTime()) {
      const left = fmtDuration((iv.close.getTime() - t) / 60000)
      // Friday's CME close is the weekly close, not a halt.
      const weekEnd = s.closeVerb === 'halts' && tzParts(iv.close, s.tz).weekday === 5
      return { open: true, detail: weekEnd ? `week ends in ${left}` : `${s.closeVerb || 'closes'} in ${left}` }
    }
  }
  const next = intervals.map(iv => iv.open.getTime()).filter(o => o > t).sort((a, b) => a - b)[0]
  if (next) {
    const nextOpen = new Date(next)
    const mins = (next - t) / 60000
    // Under a day out a countdown is most useful; further out, name the day.
    return { open: false, detail: mins < 1440 ? `opens in ${fmtDuration(mins)}` : `opens ${fmtWhen(nextOpen)}`, nextOpen }
  }
  return { open: false, detail: 'opens Monday' }
}

function upcomingHoliday(now: Date): { label: string; note: string; when: 'today' | 'tomorrow' } | null {
  const dateStr = (d: Date) => d.toLocaleDateString('en-CA')
  const today = dateStr(now)
  const tomorrow = dateStr(new Date(now.getTime() + DAY_MS))
  for (const h of HOLIDAYS) {
    if (h.date === today) return { ...h, when: 'today' }
    if (h.date === tomorrow) return { ...h, when: 'tomorrow' }
  }
  return null
}

export function MarketSessions() {
  const { themeColors, alpha } = useThemePresets()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // The visible window is the user's local day.
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const dayStartMs = dayStart.getTime()

  const sessionData = SESSIONS.map(s => {
    const intervals = sessionIntervals(now, s)
    return { def: s, intervals, status: sessionStatus(now, s, intervals), clock: tzParts(now, s.tz).clock }
  })

  const segmentsFor = (windowStartMs: number, intervals: { open: Date; close: Date }[]) => {
    const p = (ms: number) => Math.max(0, Math.min(100, ((ms - windowStartMs) / DAY_MS) * 100))
    return intervals
      .map(iv => ({ left: p(iv.open.getTime()), right: p(iv.close.getTime()) }))
      .filter(seg => seg.right - seg.left > 0.1)
  }
  // On the weekend the local day holds at most a sliver (Asia's Sunday-evening
  // open, CME's Sunday reopen) and an all-empty timeline reads as broken —
  // preview the next day that actually has trading hours on it instead. A row
  // counts as populated only when it covers a real stretch of the day.
  const populatedRowsOn = (startMs: number) =>
    sessionData.filter(r => segmentsFor(startMs, r.intervals).some(seg => seg.right - seg.left >= 100 / 6)).length
  let windowOffset = 0
  while (windowOffset < 3 && populatedRowsOn(dayStartMs + windowOffset * DAY_MS) < 2) windowOffset++
  const windowStartMs = dayStartMs + windowOffset * DAY_MS
  const isPreview = windowOffset > 0
  const previewDayLabel = new Date(windowStartMs).toLocaleDateString([], { weekday: 'long' })
  const nowPct = Math.max(0, Math.min(100, ((now.getTime() - windowStartMs) / DAY_MS) * 100))

  const rows = sessionData.map(r => ({ ...r, segments: segmentsFor(windowStartMs, r.intervals) }))

  const overlap = rows.find(r => r.def.name === 'London')?.status.open
    && rows.find(r => r.def.name === 'New York')?.status.open
  const holiday = upcomingHoliday(now)

  // First session to reopen — the headline fact while everything is closed.
  const nextUp = rows
    .filter(r => !r.status.open && r.status.nextOpen)
    .sort((a, b) => a.status.nextOpen!.getTime() - b.status.nextOpen!.getTime())[0]

  const headline = (() => {
    const open = rows.filter(r => r.status.open).map(r => r.def.name)
    if (open.length === 0) {
      if (nextUp) {
        const mins = (nextUp.status.nextOpen!.getTime() - now.getTime()) / 60000
        const when = mins < 1440 ? `in ${fmtDuration(mins)}` : fmtWhen(nextUp.status.nextOpen!)
        // A gap this long only happens on the weekend; short gaps are just the
        // daily hand-off between sessions.
        const prefix = mins > 12 * 60 ? 'Closed for the weekend' : 'All markets closed'
        return `${prefix} · ${nextUp.def.name} opens ${when}`
      }
      return 'All markets closed'
    }
    if (open.length === 1) return `${open[0]} is open`
    return `${open.slice(0, -1).join(', ')} and ${open[open.length - 1]} are open`
  })()

  const showFooter = overlap || holiday

  return (
    <div className="rounded-xl border bg-card/50">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground">Market Sessions</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{headline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold font-mono tabular-nums leading-none text-foreground">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {now.toLocaleDateString([], { weekday: 'short' })} · your time
          </p>
        </div>
      </div>

      <div className="border-t border-border/50 px-4 py-3">
        {isPreview && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Nothing trades today. Showing {previewDayLabel}'s hours in your time.
          </p>
        )}
        <div className="flex gap-3 sm:gap-4">
          {/* Name, market clock and status — status stays visible on every width */}
          <div className="shrink-0 w-32 sm:w-44">
            <div className="h-4 mb-1.5" />
            {rows.map(r => (
              <div key={r.def.name} className="h-10 flex flex-col justify-center min-w-0">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className={`text-sm leading-none truncate ${r.status.open ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {r.def.name}
                  </span>
                  <span className="text-[11px] leading-none text-muted-foreground font-mono tabular-nums shrink-0">{r.clock}</span>
                </div>
                <span
                  className="text-[11px] leading-none mt-1.5 truncate"
                  style={{ color: r.status.open ? themeColors.profit : 'hsl(var(--muted-foreground))' }}
                >
                  {r.status.detail}
                </span>
              </div>
            ))}
          </div>

          {/* Tracks share one container so a single now-line crosses them all */}
          <div className="relative flex-1 min-w-0">
            <div className="h-4 mb-1.5 relative text-[11px] font-medium text-muted-foreground">
              {[0, 6, 12, 18, 24].map(h => (
                <span
                  key={h}
                  className="absolute top-0 -translate-x-1/2 tabular-nums"
                  style={{ left: `${(h / 24) * 100}%`, transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : undefined }}
                >
                  {String(h).padStart(2, '0')}
                </span>
              ))}
            </div>

            {rows.map(r => (
              <div key={r.def.name} className="h-10 flex items-center">
                <div className="relative h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                  {r.segments.map((seg, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        left: `${seg.left}%`,
                        width: `${seg.right - seg.left}%`,
                        backgroundColor: r.status.open ? themeColors.profit : alpha(themeColors.primary, '45'),
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Now marker — hidden while previewing a future day */}
            {!isPreview && (
              <div
                className="absolute top-4 bottom-0 w-0.5 rounded-full"
                style={{ left: `${nowPct}%`, backgroundColor: themeColors.primary }}
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>

      {showFooter && (
        <div className="border-t border-border/50 px-4 py-2.5 space-y-1">
          {overlap && (
            <p className="text-xs text-muted-foreground">
              London and New York are both open. Usually the most liquid hours of the day.
            </p>
          )}
          {holiday && (
            <p className="text-xs font-medium" style={{ color: themeColors.primary }}>
              {holiday.when === 'today' ? 'Today' : 'Tomorrow'}: {holiday.label} — {holiday.note}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
