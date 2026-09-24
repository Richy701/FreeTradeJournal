import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import * as React from "react";
import { LifetimeDropTeaserEmail } from "./emails/LifetimeDropTeaserEmail";
import { LifetimeDropEmail } from "./emails/LifetimeDropEmail";
import { LifetimeDropClosingEmail } from "./emails/LifetimeDropClosingEmail";

// The three sends of the lifetime drop (25 Sep to 2 Oct 2026), one runner.
// Same audience rules as the birthday sends: everyone except lifetime owners,
// opt-outs, throttled signups and known test accounts. Each campaign has its
// own dedup field, so any re-run sends 0.
//
//   teaser   Thu 24 Sep 3:00 PM New York   the day before, full details
//   drop     Fri 25 Sep 9:30 AM New York   the reveal, at the open
//   closing  Thu  1 Oct 9:30 AM New York   the day before the close, only to
//                                          drop recipients not seen in the app
//                                          since the drop went out
//
// ARMING. Every scheduled fire first reads config/lifetimeDrop in Firestore
// and sends only if { armed: true }. Unarmed, it logs the target count and
// stops, so the functions can be deployed ahead of sign-off without a send
// slipping out. Arm from the Firebase console or scripts/send-lifetime-drop.ts.
// The date guards stop the crons matching again next year.

export type DropCampaign = "teaser" | "drop" | "closing";

const FROM = "Richy at FreeTradeJournal <richy@freetradejournal.com>";
const BATCH = 100; // Resend batch API limit
const ARM_DOC = "config/lifetimeDrop";
const DROP_SEND_DATE_UTC = "2026-09-25";

export const DROP_CAMPAIGNS: Record<DropCampaign, {
  sendDateUtc: string;
  dedupField: string;
  subject: string;
  render: (props: { firstName?: string; unsubscribeUrl?: string }) => React.ReactElement;
}> = {
  teaser: {
    sendDateUtc: "2026-09-24",
    dedupField: "lifetimeDropTeaserSentAt",
    subject: "Lifetime Pro is back tomorrow at 9:30 AM New York. $199, one week.",
    render: (p) => React.createElement(LifetimeDropTeaserEmail, p),
  },
  drop: {
    sendDateUtc: DROP_SEND_DATE_UTC,
    dedupField: "lifetimeDropSentAt",
    subject: "Doors open. Lifetime Pro is back for one week, at $199.",
    render: (p) => React.createElement(LifetimeDropEmail, p),
  },
  closing: {
    sendDateUtc: "2026-10-01",
    dedupField: "lifetimeDropClosingSentAt",
    subject: "Lifetime Pro closes tomorrow night.",
    render: (p) => React.createElement(LifetimeDropClosingEmail, p),
  },
};

const SKIP_EMAILS = new Set([
  "richyturnitup@gmail.com",
  "richmondlamptey75@gmail.com",
  "richmondolletey@gmail.com",
  "asdasd@asdasdad.com",
  "johndoe@gmail.com",
  "jidem94714@mogash.com",
  "dhshsja@gmail.con",
]);

const TYPO_DOMAINS = new Set([
  "gamil.com", "gmal.com", "gmali.com", "gmaill.com", "gmial.com",
  "yahooo.com", "yaho.com", "yahho.com", "yhoo.com",
  "hotmai.com", "hotmial.com", "hotmali.com",
  "outlok.com", "outloo.com",
]);
const DISPOSABLE_DOMAINS = new Set([
  "mogash.com", "passinbox.com", "mailinator.com", "guerrillamail.com",
  "tempmail.com", "throwam.com", "trashmail.com", "sharklasers.com",
  "spam4.me", "yopmail.com", "maildrop.cc", "dispostable.com",
  "fakeinbox.com", "getairmail.com",
]);
const BAD_TLDS = new Set(["con", "cds", "cpm", "ocm", "comd", "vom", "cmo"]);

function isBadEmail(email: string): boolean {
  const parts = email.split("@");
  if (parts.length !== 2) return true;
  const [local, domain] = parts;
  if (!local || !domain || !domain.includes(".")) return true;
  const tld = domain.split(".").pop()!.toLowerCase();
  return BAD_TLDS.has(tld) || TYPO_DOMAINS.has(domain.toLowerCase()) || DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

interface Deps {
  db: FirebaseFirestore.Firestore;
  getResend: () => Resend;
  getUnsubscribeUrl: (uid: string) => string;
  reportError: (err: unknown, ctx: { fn: string } & Record<string, unknown>) => void;
}

export interface Candidate { uid: string; email: string; name: string }

/** Everyone the campaign would go to right now. Shared by the cron and the script. */
export async function listDropCandidates(db: FirebaseFirestore.Firestore, campaign: DropCampaign): Promise<Candidate[]> {
  const { dedupField } = DROP_CAMPAIGNS[campaign];
  const dropDedup = DROP_CAMPAIGNS.drop.dedupField;
  const userDocs = new Map<string, FirebaseFirestore.DocumentData>();
  const usersSnap = await db
    .collection("users")
    .select("emailOptOut", "signupThrottled", "subscription", "lastActiveDay", dropDedup, dedupField)
    .get();
  for (const doc of usersSnap.docs) userDocs.set(doc.id, doc.data());

  const candidates: Candidate[] = [];
  let pageToken: string | undefined;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (!user.email) continue;
      if (SKIP_EMAILS.has(user.email.toLowerCase())) continue;
      const d = userDocs.get(user.uid);
      if (d?.emailOptOut || d?.signupThrottled || d?.[dedupField]) continue;
      if (d?.subscription?.planType === "lifetime") continue;
      if (campaign === "closing") {
        if (!d?.[dropDedup]) continue; // only people who got the drop email
        if (typeof d?.lastActiveDay === "string" && d.lastActiveDay >= DROP_SEND_DATE_UTC) continue; // saw the strip
      }
      if (isBadEmail(user.email)) continue;
      candidates.push({ uid: user.uid, email: user.email, name: (user.displayName || "").split(" ")[0] || "" });
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return candidates;
}

export async function isDropArmed(db: FirebaseFirestore.Firestore): Promise<boolean> {
  const snap = await db.doc(ARM_DOC).get();
  return snap.exists && snap.data()?.armed === true;
}

export async function runLifetimeDropSend(
  campaign: DropCampaign,
  { db, getResend, getUnsubscribeUrl, reportError }: Deps,
  opts: { force?: boolean; dryRun?: boolean } = {},
) {
  const cfg = DROP_CAMPAIGNS[campaign];
  const tag = `lifetimeDropSend:${campaign}`;
  const today = new Date().toISOString().slice(0, 10);
  if (!opts.force && today !== cfg.sendDateUtc) {
    functions.logger.info(`${tag}: not send day, skipping`, { today });
    return { sent: 0, failed: 0, skipped: "not send day" };
  }

  const candidates = await listDropCandidates(db, campaign);
  functions.logger.info(`${tag}: targeting`, { count: candidates.length });

  if (opts.dryRun) {
    return { sent: 0, failed: 0, targets: candidates.length, sample: candidates.slice(0, 5).map((c) => c.email) };
  }
  if (!opts.force && !(await isDropArmed(db))) {
    functions.logger.warn(`${tag}: NOT ARMED, nothing sent`, { wouldSend: candidates.length, armDoc: ARM_DOC });
    return { sent: 0, failed: 0, skipped: "not armed", wouldSend: candidates.length };
  }

  const resend = getResend();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i += BATCH) {
    const chunk = candidates.slice(i, i + BATCH);
    try {
      const payload = await Promise.all(chunk.map(async (u) => {
        const unsubscribeUrl = getUnsubscribeUrl(u.uid);
        const html = await render(cfg.render({ firstName: u.name, unsubscribeUrl }));
        return {
          from: FROM,
          to: u.email,
          subject: cfg.subject,
          html,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }));
      const result = await resend.batch.send(payload);
      if (result.error) throw new Error(JSON.stringify(result.error));

      const writes = db.batch();
      for (const u of chunk) {
        writes.set(db.collection("users").doc(u.uid), { [cfg.dedupField]: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
      await writes.commit();
      sent += chunk.length;
      functions.logger.info(`${tag}: batch ok`, { from: i, sent });
    } catch (err) {
      failed += chunk.length;
      reportError(err, { fn: tag, batchStart: i });
    }
    await new Promise((r) => setTimeout(r, 1200)); // Resend: 2 req/s
  }

  functions.logger.info(`${tag}: done`, { sent, failed });
  return { sent, failed };
}
