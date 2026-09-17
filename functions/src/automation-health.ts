// Health of the Resend-hosted automations, for the internal weekly report.
// A failed automation run is visible only in Resend's dashboard: from June to
// September 2026 every run failed at its send step and nothing reported it.
// A "completed" run proves nothing (people who log a trade exit before any
// send), so failed runs are the signal.

export interface AutomationHealth {
  name: string
  failed: number | null // null = could not be checked
}

const API = "https://api.resend.com"
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function get(apiKey: string, route: string): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(API + route, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (res.status === 429) { await sleep(1500); continue }
    if (!res.ok) throw new Error(`GET ${route} → ${res.status}`)
    return res.json()
  }
  throw new Error(`GET ${route} → rate limited`)
}

// Resend timestamps look like "2026-09-16 08:22:52.028947+00".
export function parseResendTime(value: string | null | undefined): number {
  if (!value) return NaN
  return Date.parse(value.replace(" ", "T").replace(/\+00$/, "Z"))
}

// A run can finish "completed" while the email it sent is rejected afterwards
// (seen Sep 2026: "API key is no longer active" on runs started before a key
// rotation), so failed runs alone are not enough. Counts every email in the
// window whose last event is "failed", whatever sent it.
export async function failedEmailCount(apiKey: string, sinceMs: number): Promise<{ failed: number; subjects: string[] }> {
  let failed = 0
  const subjects = new Set<string>()
  let after: string | undefined
  for (let page = 0; page < 40; page++) {
    const list = await get(apiKey, `/emails?limit=100${after ? `&after=${after}` : ""}`)
    const rows = (list.data || []) as { id: string; created_at: string; last_event: string; subject: string }[]
    for (const email of rows) {
      if (parseResendTime(email.created_at) >= sinceMs && email.last_event === "failed") {
        failed++
        subjects.add(email.subject)
      }
    }
    const pastWindow = rows.some((email) => parseResendTime(email.created_at) < sinceMs)
    if (!list.has_more || pastWindow || !rows.length) break
    after = rows[rows.length - 1].id
    await sleep(600)
  }
  return { failed, subjects: [...subjects].slice(0, 5) }
}

export async function automationHealth(apiKey: string, sinceMs: number): Promise<AutomationHealth[]> {
  const list = await get(apiKey, "/automations?status=enabled")
  const results: AutomationHealth[] = []
  for (const automation of (list.data || []) as { id: string; name: string }[]) {
    try {
      let failed = 0
      let after: string | undefined
      // Listed newest START first, but a run can fail weeks after it starts
      // (delays are capped at 30 days), so count by failure time and only stop
      // paging once runs started too long ago to have failed inside the window.
      const oldestStart = sinceMs - 31 * 86400000
      for (let page = 0; page < 20; page++) {
        const runs = await get(apiKey, `/automations/${automation.id}/runs?status=failed&limit=100${after ? `&after=${after}` : ""}`)
        const rows = (runs.data || []) as { id: string; completed_at: string | null; created_at: string }[]
        failed += rows.filter((run) => parseResendTime(run.completed_at || run.created_at) >= sinceMs).length
        const pastWindow = rows.some((run) => parseResendTime(run.created_at) < oldestStart)
        if (!runs.has_more || pastWindow || !rows.length) break
        after = rows[rows.length - 1].id
        await sleep(600)
      }
      results.push({ name: automation.name, failed })
    } catch (err) {
      console.error("automationHealth: failed to check", automation.name, err)
      results.push({ name: automation.name, failed: null })
    }
    await sleep(600)
  }
  return results
}
