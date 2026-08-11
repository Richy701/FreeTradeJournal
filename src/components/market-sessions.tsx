import { useEffect, useState } from 'react'
import { useThemePresets } from '@/contexts/theme-presets'
import { Clock } from '@phosphor-icons/react'

// Session hours are defined in each market's own IANA timezone, so daylight
// saving shifts are handled by Intl instead of hand-maintained UTC offsets.
interface SessionDef {
  name: string
  tz: string
  /** Local minutes-since-midnight when the session opens/closes. */
  start: number
  end: number
}

const SESSIONS: SessionDef[] = [
  { name: 'Sydney', tz: 'Australia/Sydney', start: 8 * 60, end: 17 * 60 },
  { name: 'Tokyo', tz: 'Asia/Tokyo', start: 9 * 60, end: 18 * 60 },
  { name: 'London', tz: 'Europe/London', start: 8 * 60, end: 17 * 60 },
  { name: 'New York', tz: 'America/New_York', start: 8 * 60, end: 17 * 60 },
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
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// Session occurrences as absolute intervals near "now" (yesterday, today and
// tomorrow in the session's own calendar), skipping weekends.
function sessionIntervals(now: Date, s: SessionDef): { open: Date; close: Date }[] {
  const out: { open: Date; close: Date }[] = []
  for (const offset of [-1, 0, 1]) {
    const ref = new Date(now.getTime() + offset * DAY_MS)
    const p = tzParts(ref, s.tz)
    if (!isTradingDay(p.weekday)) continue
    out.push({
      open: instantForTzTime(s.tz, p.year, p.month, p.day, s.start),
      close: instantForTzTime(s.tz, p.year, p.month, p.day, s.end),
    })
  }
  return out
}

function sessionStatus(now: Date, intervals: { open: Date; close: Date }[]): { open: boolean; detail: string } {
  const t = now.getTime()
  for (const iv of intervals) {
    if (t >= iv.open.getTime() && t < iv.close.getTime()) {
      return { open: true, detail: `closes in ${fmtDuration((iv.close.getTime() - t) / 60000)}` }
    }
  }
  const next = intervals.map(iv => iv.open.getTime()).filter(o => o > t).sort((a, b) => a - b)[0]
  if (next) return { open: false, detail: `opens in ${fmtDuration((next - t) / 60000)}` }
  // Weekend gap longer than the computed window (e.g. Friday evening).
  return { open: false, detail: 'opens Monday' }
}

// CME Globex for the index/energy/metal contracts our users trade:
// Sunday 17:00 to Friday 16:00 America/Chicago, with a daily 16:00-17:00 halt.
function cmeStatus(now: Date): { open: boolean; detail: string } {
  const { weekday, minutes } = tzParts(now, 'America/Chicago')
  const OPEN = 17 * 60
  const CLOSE = 16 * 60
  if (weekday === 6) return { open: false, detail: `opens in ${fmtDuration((1440 - minutes) + OPEN)}` }
  if (weekday === 0) {
    return minutes >= OPEN
      ? { open: true, detail: `daily halt in ${fmtDuration(CLOSE + 1440 - minutes)}` }
      : { open: false, detail: `opens in ${fmtDuration(OPEN - minutes)}` }
  }
  if (weekday === 5) {
    return minutes < CLOSE
      ? { open: true, detail: `week ends in ${fmtDuration(CLOSE - minutes)}` }
      : { open: false, detail: `opens in ${fmtDuration((1440 - minutes) + 1440 + OPEN)}` }
  }
  if (minutes < CLOSE) return { open: true, detail: `daily halt in ${fmtDuration(CLOSE - minutes)}` }
  if (minutes < OPEN) return { open: false, detail: `reopens in ${fmtDuration(OPEN - minutes)}` }
  return { open: true, detail: `daily halt in ${fmtDuration(CLOSE + 1440 - minutes)}` }
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
  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - dayStartMs) / DAY_MS) * 100))
  const nowPct = pct(now.getTime())

  const rows = SESSIONS.map(s => {
    const intervals = sessionIntervals(now, s)
    const status = sessionStatus(now, intervals)
    // Clip each occurrence to the visible day; a session that spans local
    // midnight naturally shows as two bars.
    const segments = intervals
      .map(iv => ({ left: pct(iv.open.getTime()), right: pct(iv.close.getTime()) }))
      .filter(seg => seg.right - seg.left > 0.1)
    return { def: s, status, segments, clock: tzParts(now, s.tz).clock }
  })

  const overlap = rows.find(r => r.def.name === 'London')?.status.open
    && rows.find(r => r.def.name === 'New York')?.status.open
  const cme = cmeStatus(now)
  const holiday = upcomingHoliday(now)

  return (
    <div className="rounded-xl border bg-card/50">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: themeColors.primary }} />
            <span className="text-sm font-semibold text-foreground">Market Sessions</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {(() => {
              const open = rows.filter(r => r.status.open).map(r => r.def.name)
              if (open.length === 0) return cme.open ? 'Forex sessions closed · CME futures trading' : 'All sessions closed'
              if (open.length === 1) return `${open[0]} is open`
              return `${open.slice(0, -1).join(', ')} and ${open[open.length - 1]} are open`
            })()}
          </p>
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
        <div className="flex gap-3">
          {/* Session labels */}
          <div className="shrink-0 w-20 sm:w-24">
            <div className="h-4 mb-2" />
            {rows.map(r => (
              <div key={r.def.name} className="h-9 flex flex-col justify-center">
                <span className={`text-sm leading-none ${r.status.open ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {r.def.name}
                </span>
                <span className="text-[11px] leading-none mt-1 text-muted-foreground font-mono tabular-nums">{r.clock}</span>
              </div>
            ))}
          </div>

          {/* Tracks share one container so a single now-line crosses them all */}
          <div className="relative flex-1 min-w-0">
            <div className="h-4 mb-2 relative text-[11px] font-medium text-muted-foreground">
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
              <div key={r.def.name} className="h-9 flex items-center">
                <div className="relative h-5 w-full rounded-md bg-muted/40 overflow-hidden">
                  {r.segments.map((seg, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 rounded-md"
                      style={{
                        left: `${seg.left}%`,
                        width: `${seg.right - seg.left}%`,
                        backgroundColor: r.status.open ? alpha(themeColors.profit, '65') : alpha(themeColors.primary, '30'),
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Now marker */}
            <div
              className="absolute top-4 bottom-0 w-0.5 rounded-full"
              style={{ left: `${nowPct}%`, backgroundColor: themeColors.primary }}
              aria-hidden
            />
          </div>

          {/* Status column */}
          <div className="shrink-0 w-24 sm:w-32 text-right hidden sm:block">
            <div className="h-4 mb-2" />
            {rows.map(r => (
              <div key={r.def.name} className="h-9 flex items-center justify-end">
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: r.status.open ? themeColors.profit : 'hsl(var(--muted-foreground))' }}
                >
                  {r.status.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 px-4 py-2.5 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            <span className={cme.open ? 'font-semibold text-foreground' : ''}>CME futures</span> (ES, NQ, CL, GC + micros)
          </span>
          <span
            className="text-[11px] font-medium whitespace-nowrap"
            style={{ color: cme.open ? themeColors.profit : 'hsl(var(--muted-foreground))' }}
          >
            {cme.open ? 'Open' : 'Closed'} · {cme.detail}
          </span>
        </div>
        {overlap && (
          <p className="text-xs text-muted-foreground">
            London and New York are both open — typically the most liquid hours of the day.
          </p>
        )}
        {holiday && (
          <p className="text-xs font-medium" style={{ color: themeColors.primary }}>
            {holiday.when === 'today' ? 'Today' : 'Tomorrow'}: {holiday.label} — {holiday.note}.
          </p>
        )}
      </div>
    </div>
  )
}
