// High-impact US scheduled releases, keyed by local calendar date (YYYY-MM-DD).
// Curated by hand from the official schedules; update once a year.
//   FOMC  federalreserve.gov/monetarypolicy/fomccalendars.htm (decision day = second meeting day)
//   NFP   BLS Employment Situation, via FRED release 50
//   CPI   BLS Consumer Price Index, via FRED release 10
//   GDP   BEA advance / second / third estimates, bea.gov/news/schedule/full
//   PCE   BEA Personal Income and Outlays, bea.gov/news/schedule/full

export type EconomicEventCode = 'FOMC' | 'NFP' | 'CPI' | 'GDP' | 'PCE'

export const ECONOMIC_EVENT_LABELS: Record<EconomicEventCode, string> = {
  FOMC: 'Fed rate decision',
  NFP: 'Non-farm payrolls',
  CPI: 'CPI inflation',
  GDP: 'GDP',
  PCE: 'PCE inflation',
}

const DATES: Record<EconomicEventCode, string[]> = {
  FOMC: [
    '2026-01-28', '2026-03-18', '2026-04-29', '2026-06-17', '2026-07-29', '2026-09-16', '2026-10-28', '2026-12-09',
    '2027-01-27', '2027-03-17', '2027-04-28', '2027-06-09', '2027-07-28', '2027-09-15', '2027-10-27', '2027-12-08',
  ],
  NFP: [
    '2026-01-09', '2026-02-11', '2026-03-06', '2026-04-03', '2026-05-08', '2026-06-05',
    '2026-07-02', '2026-08-07', '2026-09-04', '2026-10-02', '2026-11-06', '2026-12-04',
  ],
  CPI: [
    '2026-01-13', '2026-02-13', '2026-03-11', '2026-04-10', '2026-05-12', '2026-06-10',
    '2026-07-14', '2026-08-12', '2026-09-11', '2026-10-14', '2026-11-10', '2026-12-10',
  ],
  GDP: [
    '2026-01-22', '2026-02-20', '2026-03-13', '2026-04-09', '2026-04-30', '2026-05-28', '2026-06-25',
    '2026-07-30', '2026-08-26', '2026-09-30', '2026-10-29', '2026-11-25', '2026-12-23',
  ],
  PCE: [
    '2026-01-22', '2026-02-20', '2026-03-13', '2026-04-09', '2026-04-30', '2026-05-28', '2026-06-25',
    '2026-07-30', '2026-08-26', '2026-09-30', '2026-10-29', '2026-11-25', '2026-12-23',
  ],
}

const ORDER: EconomicEventCode[] = ['FOMC', 'NFP', 'CPI', 'GDP', 'PCE']

const BY_DATE: Record<string, EconomicEventCode[]> = {}
for (const code of ORDER) {
  for (const d of DATES[code]) (BY_DATE[d] ||= []).push(code)
}

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Scheduled high-impact releases on a given local calendar day, in display order. */
export function getEconomicEvents(date: Date): EconomicEventCode[] {
  return BY_DATE[toKey(date)] ?? []
}
