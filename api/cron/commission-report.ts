import type { VercelRequest, VercelResponse } from '@vercel/node';

// Weekly partner commission summary, emailed via Resend.
// Report logic mirrors scripts/commission-report.mjs (the canonical CLI tool,
// which also tracks payouts in a local ledger) — keep the two in sync.
// Triggered by the Vercel cron in vercel.json; authenticated via CRON_SECRET.

const PARTNER = 'eunice_adegelu';
const COMMISSION_RATE = 0.3;
const WINDOW_MONTHS = 12;
const PROGRAM_START = Math.floor(new Date('2026-07-06T00:00:00Z').getTime() / 1000);
const REF_SLUGS: Record<string, string[]> = { eunice_adegelu: ['eunice'] };
const REPORT_TO = 'Richmondlamptey75@gmail.com';
const FROM_EMAIL = 'FreeTradeJournal <hello@freetradejournal.com>';

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

async function stripeGet(key: string, path: string, params: Record<string, string | string[]> = {}) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
    else url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const body = await res.json();
  if (body.error) throw new Error(`${path}: ${body.error.message}`);
  return body;
}

async function listAll(key: string, path: string, params: Record<string, string | string[]> = {}) {
  const items: any[] = [];
  let startingAfter: string | undefined;
  do {
    const page = await stripeGet(key, path, {
      ...params,
      limit: '100',
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    items.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1).id : undefined;
  } while (startingAfter);
  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!stripeKey || !resendKey) {
    res.status(503).json({ error: 'Missing STRIPE_SECRET_KEY or RESEND_API_KEY' });
    return;
  }

  // 1. Partner's promotion codes (matched by metadata, not code name)
  const promoCodes = (await listAll(stripeKey, 'promotion_codes')).filter(
    (p) => p.metadata?.partner === PARTNER,
  );
  const promoIds = new Set(promoCodes.map((p) => p.id));

  // 2. Referral ledger: completed checkout sessions attributed via partner
  //    code or via ?ref= slug in session metadata
  const refSlugs = new Set(REF_SLUGS[PARTNER] ?? []);
  const sessions = await listAll(stripeKey, 'checkout/sessions', {
    status: 'complete',
    'created[gte]': String(PROGRAM_START),
    'expand[]': ['data.total_details.breakdown'],
  });
  const referrals = new Map<string, { start: number; mode: string; via: string }>();
  for (const s of sessions) {
    const discounts = s.total_details?.breakdown?.discounts ?? [];
    const byCode = discounts.some((d: any) => {
      const promo = d.discount?.promotion_code;
      return promoIds.has(typeof promo === 'string' ? promo : promo?.id);
    });
    const byRef = refSlugs.has(s.metadata?.ref);
    if ((!byCode && !byRef) || !s.customer) continue;
    const existing = referrals.get(s.customer);
    if (!existing || s.created < existing.start) {
      referrals.set(s.customer, { start: s.created, mode: s.mode, via: byCode ? 'code' : 'ref link' });
    }
  }

  // 3. Collected revenue per referral within the commission window
  const now = Math.floor(Date.now() / 1000);
  const monthStart = Math.floor(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1) / 1000,
  );
  let totalNet = 0;
  let totalMonthNet = 0;
  const rows: {
    email: string; start: string; mode: string; via: string;
    windowEnds: string; active: boolean; net: number; monthNet: number;
  }[] = [];

  for (const [customerId, ref] of referrals) {
    const windowEnd = ref.start + WINDOW_MONTHS * 30.44 * 24 * 3600;
    const charges = await listAll(stripeKey, 'charges', {
      customer: customerId,
      'created[gte]': String(ref.start),
    });
    let net = 0;
    let monthNet = 0;
    for (const c of charges) {
      if (!c.paid || c.created > windowEnd) continue;
      const chargeNet = c.amount - c.amount_refunded;
      net += chargeNet;
      if (c.created >= monthStart) monthNet += chargeNet;
    }
    const customer = await stripeGet(stripeKey, `customers/${customerId}`);
    totalNet += net;
    totalMonthNet += monthNet;
    rows.push({
      email: customer.email ?? customerId,
      start: day(ref.start),
      mode: ref.mode,
      via: ref.via,
      windowEnds: day(windowEnd),
      active: now < windowEnd,
      net,
      monthNet,
    });
  }
  rows.sort((a, b) => (a.start < b.start ? -1 : 1));

  const codeList = promoCodes
    .map((p) => `${p.code}${p.active ? '' : ' (inactive)'}`)
    .join(', ') || 'none found';

  const rowsHtml = rows.length
    ? rows
        .map(
          (r) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${r.email}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${r.start} (${r.via})</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${r.windowEnds}${r.active ? '' : ' (expired)'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;">${usd(r.net)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;">${usd(r.monthNet)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;">${usd(r.net * COMMISSION_RATE)}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="6" style="padding:16px 12px;color:#666;">No referrals yet.</td></tr>`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:720px;margin:0 auto;color:#171717;">
      <h2 style="margin:24px 0 4px;">Partner commission report</h2>
      <p style="margin:0 0 16px;color:#666;">Partner: ${PARTNER} · Codes: ${codeList} · Rate: ${COMMISSION_RATE * 100}% · Window: ${WINDOW_MONTHS} months</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="text-align:left;">
            <th style="padding:8px 12px;border-bottom:2px solid #171717;">Customer</th>
            <th style="padding:8px 12px;border-bottom:2px solid #171717;">Referred</th>
            <th style="padding:8px 12px;border-bottom:2px solid #171717;">Window ends</th>
            <th style="padding:8px 12px;border-bottom:2px solid #171717;text-align:right;">Collected</th>
            <th style="padding:8px 12px;border-bottom:2px solid #171717;text-align:right;">This month</th>
            <th style="padding:8px 12px;border-bottom:2px solid #171717;text-align:right;">Commission</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin:16px 0 4px;"><strong>Commission earned all-time (in-window): ${usd(totalNet * COMMISSION_RATE)}</strong></p>
      <p style="margin:0 0 4px;">Collected this calendar month: ${usd(totalMonthNet)} · commission on it: ${usd(totalMonthNet * COMMISSION_RATE)}</p>
      <p style="margin:16px 0;color:#666;font-size:13px;">Payouts are tracked locally — run <code>node scripts/commission-report.mjs</code> for balance due and <code>--record-payout</code> to log payments.</p>
    </div>`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: REPORT_TO,
      subject: `Commission report: ${rows.length} referral${rows.length === 1 ? '' : 's'}, ${usd(totalNet * COMMISSION_RATE)} earned (${PARTNER})`,
      html,
    }),
  });
  if (!emailRes.ok) {
    const err = await emailRes.text();
    res.status(502).json({ error: `Resend failed: ${err}` });
    return;
  }

  res.status(200).json({ referrals: rows.length, commissionCents: Math.round(totalNet * COMMISSION_RATE) });
}
