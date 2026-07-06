#!/usr/bin/env node
/**
 * Partner commission report.
 *
 * Finds every completed Stripe Checkout session attributed to a partner —
 * either by redeeming one of their promotion codes (matched by promo-code
 * metadata `partner`, so it survives code renames) or by carrying the
 * partner's ?ref= slug in session metadata — builds the referral ledger,
 * then sums each referral's collected charges (net of refunds) inside their
 * commission window and computes the commission owed.
 *
 * Usage:
 *   node scripts/commission-report.mjs                        # report for default partner
 *   node scripts/commission-report.mjs --partner=slug         # different partner metadata value
 *   node scripts/commission-report.mjs --record-payout=45.00  # log a payout, then report
 *
 * Payouts are logged in ~/Documents/ftj-commission-payouts.json and
 * subtracted from the commission owed to show the balance due.
 *
 * Reads STRIPE_SECRET_KEY from functions/.env. Stripe access is read-only.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PARTNER = process.argv.find((a) => a.startsWith("--partner="))?.split("=")[1]
  ?? "eunice_adegelu";
const COMMISSION_RATE = 0.30;
const WINDOW_MONTHS = 12;
const PROGRAM_START = Math.floor(new Date("2026-07-06T00:00:00Z").getTime() / 1000);
// ?ref= slugs that attribute to each partner (see src/lib/referral.ts)
const REF_SLUGS = { eunice_adegelu: ["eunice"] };
const PAYOUT_LEDGER = join(homedir(), "Documents", "ftj-commission-payouts.json");

const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", "functions", ".env");
const key = readFileSync(envPath, "utf8").match(/^STRIPE_SECRET_KEY=(.+)$/m)?.[1]?.trim();
if (!key) {
  console.error(`STRIPE_SECRET_KEY not found in ${envPath}`);
  process.exit(1);
}

async function stripeGet(path, params = {}) {
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

async function listAll(path, params = {}) {
  const items = [];
  let startingAfter;
  do {
    const page = await stripeGet(path, {
      ...params,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    items.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1).id : undefined;
  } while (startingAfter);
  return items;
}

const usd = (cents) => `$${(cents / 100).toFixed(2)}`;
const day = (unix) => new Date(unix * 1000).toISOString().slice(0, 10);

function readLedger() {
  if (!existsSync(PAYOUT_LEDGER)) return [];
  return JSON.parse(readFileSync(PAYOUT_LEDGER, "utf8"));
}

const recordArg = process.argv.find((a) => a.startsWith("--record-payout="));
if (recordArg) {
  const amount = Number(recordArg.split("=")[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error("Invalid --record-payout amount.");
    process.exit(1);
  }
  const ledger = readLedger();
  ledger.push({ partner: PARTNER, date: new Date().toISOString().slice(0, 10), amount });
  writeFileSync(PAYOUT_LEDGER, JSON.stringify(ledger, null, 2) + "\n");
  console.log(`Recorded payout of ${usd(amount * 100)} to ${PARTNER} in ${PAYOUT_LEDGER}\n`);
}

// 1. Partner's promotion codes (matched by metadata, not code name)
const promoCodes = (await listAll("promotion_codes")).filter(
  (p) => p.metadata?.partner === PARTNER,
);
if (promoCodes.length === 0) {
  console.error(`No promotion codes found with metadata partner=${PARTNER}`);
  process.exit(1);
}
const promoIds = new Set(promoCodes.map((p) => p.id));
console.log(`Partner: ${PARTNER}`);
console.log(`Codes: ${promoCodes.map((p) => `${p.code}${p.active ? "" : " (inactive)"}`).join(", ")}\n`);

// 2. Referral ledger: completed checkout sessions attributed via partner code
//    or via ?ref= slug in session metadata
const refSlugs = new Set(REF_SLUGS[PARTNER] ?? []);
const sessions = await listAll("checkout/sessions", {
  status: "complete",
  "created[gte]": PROGRAM_START,
  "expand[]": ["data.total_details.breakdown"],
});
const referrals = new Map(); // customerId -> { start, mode, via }
for (const s of sessions) {
  const discounts = s.total_details?.breakdown?.discounts ?? [];
  const byCode = discounts.some((d) => {
    const promo = d.discount?.promotion_code;
    return promoIds.has(typeof promo === "string" ? promo : promo?.id);
  });
  const byRef = refSlugs.has(s.metadata?.ref);
  if ((!byCode && !byRef) || !s.customer) continue;
  const existing = referrals.get(s.customer);
  if (!existing || s.created < existing.start) {
    referrals.set(s.customer, { start: s.created, mode: s.mode, via: byCode ? "code" : "ref link" });
  }
}

if (referrals.size === 0) {
  console.log("No referrals yet — nothing owed.");
  process.exit(0);
}

// 3. Collected revenue per referral within the commission window
const now = Math.floor(Date.now() / 1000);
const monthStart = Math.floor(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1) / 1000);
let totalNet = 0;
let totalMonthNet = 0;
const rows = [];

for (const [customerId, ref] of referrals) {
  const windowEnd = ref.start + WINDOW_MONTHS * 30.44 * 24 * 3600;
  const charges = await listAll("charges", { customer: customerId, "created[gte]": ref.start });
  let net = 0;
  let monthNet = 0;
  for (const c of charges) {
    if (!c.paid || c.created > windowEnd) continue;
    const chargeNet = c.amount - c.amount_refunded;
    net += chargeNet;
    if (c.created >= monthStart) monthNet += chargeNet;
  }
  const customer = await stripeGet(`customers/${customerId}`);
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
console.log(`Referrals: ${rows.length}\n`);
for (const r of rows) {
  console.log(
    `  ${r.email}\n` +
    `    referred ${r.start} (${r.mode}, via ${r.via}) · window ends ${r.windowEnds}${r.active ? "" : " (expired)"}\n` +
    `    collected in window: ${usd(r.net)} · this month: ${usd(r.monthNet)} · commission: ${usd(r.net * COMMISSION_RATE)}`,
  );
}

const paidOut = readLedger()
  .filter((p) => p.partner === PARTNER)
  .reduce((sum, p) => sum + p.amount * 100, 0);

console.log(`\nTotals`);
console.log(`  Collected (all-time, in-window): ${usd(totalNet)}`);
console.log(`  Commission earned all-time (${COMMISSION_RATE * 100}%): ${usd(totalNet * COMMISSION_RATE)}`);
console.log(`  Collected this calendar month: ${usd(totalMonthNet)}`);
console.log(`  Commission on this month: ${usd(totalMonthNet * COMMISSION_RATE)}`);
console.log(`  Paid out to date: ${usd(paidOut)}`);
console.log(`  BALANCE DUE: ${usd(totalNet * COMMISSION_RATE - paidOut)}`);
console.log(`\nPay 30 days in arrears; log payments with --record-payout=AMOUNT.`);
