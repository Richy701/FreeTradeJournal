const DAY = 86_400_000
const WEEK = 7 * DAY

export interface ActivationMember {
  created: number
  firstTradeAt?: number
  throttled?: boolean
}

export interface ActivationCohort {
  week: string
  signups: number
  activated: number
  mature: boolean
  rate: number | null
}

export function activationCohorts(members: ActivationMember[], now: number): ActivationCohort[] {
  const weeks = new Map<string, ActivationCohort>()
  for (const member of members) {
    if (member.throttled || !Number.isFinite(member.created) || member.created <= 0 || member.created > now) continue
    const start = new Date(member.created)
    start.setUTCHours(0, 0, 0, 0)
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7)
    const week = start.toISOString().slice(0, 10)
    const cohort = weeks.get(week) ?? { week, signups: 0, activated: 0, mature: now >= start.getTime() + 2 * WEEK, rate: null }
    cohort.signups++
    if (member.firstTradeAt !== undefined && member.firstTradeAt >= member.created && member.firstTradeAt < member.created + WEEK && member.firstTradeAt <= now) cohort.activated++
    weeks.set(week, cohort)
  }
  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week)).map(row => ({ ...row, rate: row.mature ? Math.round(row.activated / row.signups * 100) : null }))
}

export function activityTiming(day: unknown, hour: unknown) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const validDay = typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= 7
  const validHour = typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23
  return {
    busiestDay: validDay ? days[day - 1] : null,
    busiestHour: validHour ? `${String(hour).padStart(2, '0')}:00 to ${String((hour + 1) % 24).padStart(2, '0')}:00 UTC` : null,
  }
}
