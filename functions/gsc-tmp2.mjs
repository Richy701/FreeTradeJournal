import { GoogleAuth } from 'google-auth-library'
import fs from 'node:fs'
const S = process.argv[2]
const auth = new GoogleAuth({ keyFile: '/Users/richy/FreeTradeJournal/functions/service-account.json', scopes: ['https://www.googleapis.com/auth/webmasters'] })
const client = await auth.getClient()
const site = 'https://www.freetradejournal.com/'
const urls = fs.readFileSync(`${S}/sitemap-urls.txt`, 'utf8').trim().split('\n')
const insp = []
for (const url of urls) {
  try {
    const r = await client.request({ url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', method: 'POST', data: { inspectionUrl: url, siteUrl: site } })
    const i = r.data.inspectionResult.indexStatusResult
    insp.push({ url: url.replace(site, '/'), verdict: i.verdict, coverage: i.coverageState, lastCrawl: (i.lastCrawlTime || '').slice(0, 10), userCanonical: i.userCanonical, googleCanonical: i.googleCanonical, robots: i.robotsTxtState, indexing: i.indexingState, referring: (i.referringUrls || []).length })
  } catch (e) { insp.push({ url, error: e.message.slice(0, 120) }) }
  process.stderr.write('.')
}
fs.writeFileSync(`${S}/inspect.json`, JSON.stringify(insp, null, 1))
console.log('\nverdict | coverage | lastCrawl | canon match | path')
for (const i of insp) console.log([i.verdict, i.coverage, i.lastCrawl || '-', i.googleCanonical ? (i.googleCanonical === i.userCanonical ? 'same' : 'DIFF:' + i.googleCanonical) : '-', i.url, i.error || ''].join(' | '))
// head-query trend by week
const q = async (body) => (await client.request({ url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, method: 'POST', data: body })).data.rows || []
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const heads = ['free trading journal', 'trading journal free', 'trade journal', 'trading journal', 'free trade journal']
const rows = await q({ startDate: d(150), endDate: d(3), dimensions: ['date', 'query'], dimensionFilterGroups: [{ filters: heads.map((h) => ({ dimension: 'query', operator: 'equals', expression: h })), groupType: 'or' }], rowLimit: 2000 })
const wk = {}
for (const r of rows) { const dt = new Date(r.keys[0]); const k = new Date(dt - ((dt.getDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); const w = (wk[k] = wk[k] || {}); const c = (w[r.keys[1]] = w[r.keys[1]] || { c: 0, i: 0, p: 0 }); c.c += r.clicks; c.i += r.impressions; c.p += r.position * r.impressions }
console.log('\nweek | ' + heads.map((h) => h + ' (clicks/impr/pos)').join(' | '))
for (const [k, w] of Object.entries(wk).sort()) console.log(k + ' | ' + heads.map((h) => { const c = w[h]; return c ? `${c.c}/${c.i}/${(c.p / c.i).toFixed(1)}` : '-' }).join(' | '))
const us = await q({ startDate: d(150), endDate: d(3), dimensions: ['date'], dimensionFilterGroups: [{ filters: [{ dimension: 'country', operator: 'equals', expression: 'usa' }] }], rowLimit: 200 })
const uw = {}; for (const r of us) { const dt = new Date(r.keys[0]); const k = new Date(dt - ((dt.getDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); const w = (uw[k] = uw[k] || { c: 0, i: 0, p: 0 }); w.c += r.clicks; w.i += r.impressions; w.p += r.position * r.impressions }
console.log('\nUSA week | clicks | impr | pos'); for (const [k, w] of Object.entries(uw).sort()) console.log(k, w.c, w.i, (w.p / w.i).toFixed(1))
