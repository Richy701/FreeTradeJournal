import type { VercelRequest, VercelResponse } from '@vercel/node';

// Weekly partner commission emails, sent via Resend every Monday (see
// vercel.json crons). Two emails on the shared dark-card email design
// (mirrors functions/src/emails/components.tsx tokens):
//   1. Internal owner report (full detail, customer emails) -> REPORT_TO
//   2. Partner-safe summary (counts + commission only)      -> PARTNER_REPORT_TO
// Report logic mirrors scripts/commission-report.mjs (the canonical CLI tool,
// which also tracks payouts in a local ledger) — keep the two in sync.
// Authenticated via CRON_SECRET.

const PARTNER = 'eunice_adegelu';
const PARTNER_NAME = 'Eunice';
const COMMISSION_RATE = 0.3;
const WINDOW_MONTHS = 12;
const PROGRAM_START = Math.floor(new Date('2026-07-06T00:00:00Z').getTime() / 1000);
const REF_SLUGS: Record<string, string[]> = { eunice_adegelu: ['eunice'] };
const REF_LINK = 'https://freetradejournal.com/pricing?ref=eunice';
const REPORT_TO = 'Richmondlamptey75@gmail.com';
// Agreement signed 2026-07-09 — partner update goes directly to Eunice.
const PARTNER_REPORT_TO = 'yeuniss28@gmail.com';
// Partner accounts whose own purchases never count as commissionable referrals.
const EXCLUDED_EMAILS = new Set(['yeuniss28@gmail.com']);
const FROM_EMAIL = 'FreeTradeJournal <hello@freetradejournal.com>';

// Design tokens — mirror functions/src/emails/components.tsx `tone`
const T = {
  page: '#0f0f10',
  card: '#17181a',
  cardBorder: '#26272b',
  inset: '#1d1e21',
  insetBorder: '#2b2c31',
  divider: '#232327',
  heading: '#f5f5f6',
  body: '#b6b6bd',
  muted: '#8b8b93',
  faint: '#6e6e76',
  amber: '#f59e0b',
};
const FONT = "Inter, -apple-system, 'Segoe UI', Arial, sans-serif";
const LOGO = 'https://www.freetradejournal.com/favicon-64x64.png';

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

// ─── Email building blocks (dark-card shell) ────────────────

function statTile(value: string, label: string) {
  return `<td width="50%" style="background-color:${T.inset};border:1px solid ${T.insetBorder};border-radius:10px;padding:18px 12px;text-align:center;">
    <p style="font-size:26px;font-weight:700;margin:0 0 2px;line-height:1.2;color:${T.heading};">${value}</p>
    <p style="font-size:11px;font-weight:600;color:${T.muted};text-transform:uppercase;letter-spacing:0.06em;margin:0;">${label}</p>
  </td>`;
}

function statGrid(stats: [string, string][]) {
  let rows = '';
  for (let i = 0; i < stats.length; i += 2) {
    rows += `<tr>${stats.slice(i, i + 2).map(([v, l]) => statTile(v, l)).join('')}</tr>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:8px;">${rows}</table>`;
}

function eyebrow(text: string, quiet = false) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;"><tr>
    <td style="background-color:${quiet ? T.inset : '#2a2113'};border-radius:999px;padding:4px 12px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${quiet ? T.muted : T.amber};line-height:16px;">${text}</p>
    </td>
  </tr></table>`;
}

function shell(content: string, footerNote: string) {
  return `<body style="background-color:${T.page};font-family:${FONT};margin:0;padding:32px 12px;">
    <div style="max-width:600px;margin:0 auto;">
      <div style="background-color:${T.card};border:1px solid ${T.cardBorder};border-radius:12px;overflow:hidden;">
        <div style="padding:20px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;"><img src="${LOGO}" width="26" height="26" alt="FreeTradeJournal" style="border-radius:6px;display:block;" /></td>
            <td style="vertical-align:middle;padding-left:10px;"><p style="margin:0;font-size:14px;font-weight:600;color:${T.heading};line-height:26px;">FreeTradeJournal</p></td>
          </tr></table>
        </div>
        <hr style="border:none;border-top:1px solid ${T.divider};margin:0;" />
        <div style="padding:28px 32px;">${content}</div>
      </div>
      <div style="padding:20px 24px 0;text-align:center;">
        <p style="font-size:12px;color:${T.faint};line-height:1.6;margin:0;">${footerNote}</p>
      </div>
    </div>
  </body>`;
}

const h1 = (text: string) =>
  `<h1 style="font-size:25px;font-weight:700;color:${T.heading};margin:0 0 14px;line-height:1.3;letter-spacing:-0.01em;">${text}</h1>`;
const para = (text: string) =>
  `<p style="font-size:15px;color:${T.body};line-height:1.6;margin:0 0 16px;">${text}</p>`;
const fine = (text: string) =>
  `<p style="font-size:13px;color:${T.muted};line-height:1.6;margin:16px 0 0;">${text}</p>`;

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

  const now = Math.floor(Date.now() / 1000);
  const weekStart = now - 7 * 24 * 3600;
  const monthStart = Math.floor(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1) / 1000,
  );

  // 1. Partner's promotion codes (matched by metadata, not code name)
  const promoCodes = (await listAll(stripeKey, 'promotion_codes')).filter(
    (p) => p.metadata?.partner === PARTNER,
  );
  const promoIdToCode = new Map<string, string>(promoCodes.map((p) => [p.id, p.code]));

  // 2. Referral ledger: completed checkout sessions attributed via partner
  //    code or via ?ref= slug in session metadata
  const refSlugs = new Set(REF_SLUGS[PARTNER] ?? []);
  const sessions = await listAll(stripeKey, 'checkout/sessions', {
    status: 'complete',
    'created[gte]': String(PROGRAM_START),
    'expand[]': ['data.total_details.breakdown'],
  });
  const referrals = new Map<string, { start: number; mode: string; via: string }>();
  // code -> { total, week } completed-checkout redemption counts
  const codeUse = new Map<string, { total: number; week: number }>(
    [...promoIdToCode.values()].map((c) => [c, { total: 0, week: 0 }]),
  );
  for (const s of sessions) {
    const discounts = s.total_details?.breakdown?.discounts ?? [];
    let matchedCode: string | undefined;
    for (const d of discounts) {
      const promo = d.discount?.promotion_code;
      const promoId = typeof promo === 'string' ? promo : promo?.id;
      if (promoId && promoIdToCode.has(promoId)) {
        matchedCode = promoIdToCode.get(promoId);
        break;
      }
    }
    const byRef = refSlugs.has(s.metadata?.ref);
    if ((!matchedCode && !byRef) || !s.customer) continue;
    if (matchedCode) {
      const use = codeUse.get(matchedCode)!;
      use.total += 1;
      if (s.created >= weekStart) use.week += 1;
    }
    const existing = referrals.get(s.customer);
    if (!existing || s.created < existing.start) {
      referrals.set(s.customer, {
        start: s.created,
        mode: s.mode,
        via: matchedCode ? `code ${matchedCode}` : 'ref link',
      });
    }
  }

  // 3. Collected revenue per referral within the commission window
  let totalNet = 0;
  let monthNet = 0;
  let weekNet = 0;
  const rows: {
    email: string; start: string; via: string; windowEnds: string;
    active: boolean; net: number;
  }[] = [];

  for (const [customerId, ref] of referrals) {
    const customer = await stripeGet(stripeKey, `customers/${customerId}`);
    // The partner's own purchases are never commissionable (agreement: personal
    // discount via EUNICE30; she may also use her own code/link, so exclude by email).
    if (EXCLUDED_EMAILS.has((customer.email ?? '').toLowerCase())) {
      referrals.delete(customerId);
      continue;
    }
    const windowEnd = ref.start + WINDOW_MONTHS * 30.44 * 24 * 3600;
    const charges = await listAll(stripeKey, 'charges', {
      customer: customerId,
      'created[gte]': String(ref.start),
    });
    let net = 0;
    for (const c of charges) {
      if (!c.paid || c.created > windowEnd) continue;
      const chargeNet = c.amount - c.amount_refunded;
      net += chargeNet;
      if (c.created >= monthStart) monthNet += chargeNet;
      if (c.created >= weekStart) weekNet += chargeNet;
    }
    totalNet += net;
    rows.push({
      email: customer.email ?? customerId,
      start: day(ref.start),
      via: ref.via,
      windowEnds: day(windowEnd),
      active: now < windowEnd,
      net,
    });
  }
  rows.sort((a, b) => (a.start < b.start ? -1 : 1));

  const newThisWeek = [...referrals.values()].filter((r) => r.start >= weekStart).length;
  const codeLines = [...codeUse.entries()]
    .map(([code, use]) => `<strong style="color:${T.heading};">${code}</strong> — ${use.week} this week, ${use.total} total`)
    .join('<br/>');

  // ─── Partner email (Eunice-safe: no customer identities) ──
  const partnerIntro =
    referrals.size === 0
      ? 'No sign-ups through your codes yet — here is your weekly snapshot so you always know where things stand.'
      : newThisWeek > 0
        ? `Great week — ${newThisWeek} new ${newThisWeek === 1 ? 'trader' : 'traders'} joined through you.`
        : 'Here is your weekly snapshot.';

  const partnerHtml = shell(
    eyebrow('Partner update') +
      h1('Your weekly referral update') +
      para(partnerIntro) +
      statGrid([
        [String(newThisWeek), 'New this week'],
        [String(referrals.size), 'Total referrals'],
        [usd(weekNet * COMMISSION_RATE), 'Earned this week'],
        [usd(totalNet * COMMISSION_RATE), 'Earned so far'],
      ]) +
      `<div style="background-color:${T.inset};border:1px solid ${T.insetBorder};border-radius:10px;padding:16px 18px;margin-top:16px;">
        <p style="font-size:11px;font-weight:700;color:${T.amber};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Your codes</p>
        <p style="font-size:14px;color:${T.body};line-height:1.8;margin:0;">${codeLines}</p>
      </div>` +
      fine(`Your share link: <a href="${REF_LINK}" style="color:${T.amber};">freetradejournal.com/pricing?ref=eunice</a>. You earn ${COMMISSION_RATE * 100}% of everything your referrals pay in their first ${WINDOW_MONTHS} months.`),
    'Richy from FreeTradeJournal. Reply if you have questions — I read every one.',
  );

  // ─── Internal email (full detail) ─────────────────────────
  const detailRows = rows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;font-size:13px;color:${T.body};">
        ${rows
          .map(
            (r) => `<tr>
              <td style="padding:8px 0;border-bottom:1px solid ${T.divider};">${r.email}<br/>
                <span style="color:${T.muted};font-size:12px;">${r.start} via ${r.via} — window ends ${r.windowEnds}${r.active ? '' : ' (expired)'}</span></td>
              <td style="padding:8px 0;border-bottom:1px solid ${T.divider};text-align:right;vertical-align:top;">
                ${usd(r.net)}<br/><span style="color:${T.muted};font-size:12px;">${usd(r.net * COMMISSION_RATE)} commission</span></td>
            </tr>`,
          )
          .join('')}
      </table>`
    : '';

  const internalHtml = shell(
    eyebrow('Internal report', true) +
      h1(`Partner commissions: ${PARTNER_NAME}`) +
      statGrid([
        [String(referrals.size), 'Referrals'],
        [String(newThisWeek), 'New this week'],
        [usd(monthNet * COMMISSION_RATE), 'Commission this month'],
        [usd(totalNet * COMMISSION_RATE), 'Commission all-time'],
      ]) +
      `<div style="background-color:${T.inset};border:1px solid ${T.insetBorder};border-radius:10px;padding:16px 18px;margin-top:16px;">
        <p style="font-size:11px;font-weight:700;color:${T.amber};letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">Code redemptions</p>
        <p style="font-size:14px;color:${T.body};line-height:1.8;margin:0;">${codeLines || 'No partner codes found in Stripe.'}</p>
      </div>` +
      detailRows +
      fine(`Rate ${COMMISSION_RATE * 100}%, ${WINDOW_MONTHS}-month window, net of refunds. Balance due and payouts: <code style="color:${T.body};">node scripts/commission-report.mjs</code>.`),
    'FreeTradeJournal internal report.',
  );

  // ─── Send both via Resend batch ────────────────────────────
  const weekOf = day(weekStart);
  const emailRes = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        from: FROM_EMAIL,
        to: PARTNER_REPORT_TO,
        subject: `Your FreeTradeJournal partner update`,
        html: partnerHtml,
      },
      {
        from: FROM_EMAIL,
        to: REPORT_TO,
        subject: `Internal: ${PARTNER_NAME} commissions — ${rows.length} referral${rows.length === 1 ? '' : 's'}, ${usd(totalNet * COMMISSION_RATE)} all-time (week of ${weekOf})`,
        html: internalHtml,
      },
    ]),
  });
  if (!emailRes.ok) {
    const err = await emailRes.text();
    res.status(502).json({ error: `Resend failed: ${err}` });
    return;
  }

  res.status(200).json({
    referrals: rows.length,
    newThisWeek,
    commissionCents: Math.round(totalNet * COMMISSION_RATE),
  });
}
