/**
 * One definition of "this week" for the whole app: Sunday 00:00 local time.
 * Weekly goals, the dashboard chips and goal suggestions all go through here
 * so they agree on which trades count.
 */
export function startOfWeek(date: Date = new Date()): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - start.getDay())
  return start
}

/** Stable key for grouping dates into weeks (ms of the week's Sunday). */
export function weekKey(date: Date): number {
  return startOfWeek(date).getTime()
}
