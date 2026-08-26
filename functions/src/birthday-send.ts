import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import * as React from "react";
import { BirthdayLifetimeEmail } from "./emails/BirthdayLifetimeEmail";

// One-off cloud send for the first-birthday lifetime offer. Replaces the
// launchd job (com.freetradejournal.birthday-update) so it does not depend on
// Richy's laptop being awake. Mirrors scripts/send-birthday-update.ts exactly:
// everyone except lifetime owners, opt-outs, throttled signups and known test
// accounts. Dedup field birthdayUpdateSentAt makes any re-run send 0.
//
// Fires Fri 28 Aug 2026 14:00 Europe/London (13:00 UTC). The date guard below
// stops the cron matching again next August.

const SEND_DATE_UTC = "2026-08-28";
const FROM = "Richy at FreeTradeJournal <richy@freetradejournal.com>";
const SUBJECT = "FreeTradeJournal is one year old. Lifetime Pro is back for one week.";
const DEDUP_FIELD = "birthdayUpdateSentAt";
const BATCH = 100; // Resend batch API limit

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

export async function runBirthdaySend({ db, getResend, getUnsubscribeUrl, reportError }: Deps, opts: { force?: boolean } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  if (!opts.force && today !== SEND_DATE_UTC) {
    functions.logger.info("birthdaySend: not send day, skipping", { today });
    return { sent: 0, failed: 0, skipped: "not send day" };
  }

  const userDocs = new Map<string, FirebaseFirestore.DocumentData>();
  const usersSnap = await db.collection("users").select("emailOptOut", "signupThrottled", "subscription", DEDUP_FIELD).get();
  for (const doc of usersSnap.docs) userDocs.set(doc.id, doc.data());

  const candidates: { uid: string; email: string; name: string }[] = [];
  let pageToken: string | undefined;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (!user.email) continue;
      if (SKIP_EMAILS.has(user.email.toLowerCase())) continue;
      const d = userDocs.get(user.uid);
      if (d?.emailOptOut || d?.signupThrottled || d?.[DEDUP_FIELD]) continue;
      if (d?.subscription?.planType === "lifetime") continue;
      if (isBadEmail(user.email)) continue;
      candidates.push({ uid: user.uid, email: user.email, name: (user.displayName || "").split(" ")[0] || "" });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  functions.logger.info("birthdaySend: targeting", { count: candidates.length });

  const resend = getResend();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i += BATCH) {
    const chunk = candidates.slice(i, i + BATCH);
    try {
      const payload = await Promise.all(chunk.map(async (u) => {
        const unsubscribeUrl = getUnsubscribeUrl(u.uid);
        const html = await render(React.createElement(BirthdayLifetimeEmail, { firstName: u.name, unsubscribeUrl }));
        return {
          from: FROM,
          to: u.email,
          subject: SUBJECT,
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
        writes.set(db.collection("users").doc(u.uid), { [DEDUP_FIELD]: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
      await writes.commit();
      sent += chunk.length;
      functions.logger.info("birthdaySend: batch ok", { from: i, sent });
    } catch (err) {
      failed += chunk.length;
      reportError(err, { fn: "birthdaySend", batchStart: i });
    }
    await new Promise((r) => setTimeout(r, 1200)); // Resend: 2 req/s
  }

  functions.logger.info("birthdaySend: done", { sent, failed });
  return { sent, failed };
}
