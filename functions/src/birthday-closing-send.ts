import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import * as React from "react";
import { BirthdayLifetimeClosingEmail } from "./emails/BirthdayLifetimeClosingEmail";

// Closing reminder for the birthday lifetime week. Same shape as
// birthday-send.ts. Fires Thu 3 Sep 2026 14:00 Europe/London, the day BEFORE
// the deadline (in August the final day converted nobody, the day before did).
//
// Audience = the 28 Aug recipients who have NOT been in the app since the
// email went out. Resend open tracking is off for the domain, so "did not
// open" is unknowable; "not active since the send" is the closest proxy, and
// anyone active since has seen the in-app banner anyway. Lifetime owners
// (including this week's buyers), opt-outs and throttled signups are skipped.

const SEND_DATE_UTC = "2026-09-03";
const FROM = "Richy at FreeTradeJournal <richy@freetradejournal.com>";
const SUBJECT = "Lifetime Pro at $199 closes tomorrow night.";
const ACTIVE_SINCE = "2026-08-28";
const DEDUP_FIELD = "birthdayClosingSentAt";
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

export async function runBirthdayClosingSend({ db, getResend, getUnsubscribeUrl, reportError }: Deps, opts: { force?: boolean; dryRun?: boolean } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  if (!opts.force && today !== SEND_DATE_UTC) {
    functions.logger.info("birthdayClosingSend: not send day, skipping", { today });
    return { sent: 0, failed: 0, skipped: "not send day" };
  }

  const userDocs = new Map<string, FirebaseFirestore.DocumentData>();
  const usersSnap = await db.collection("users").select("emailOptOut", "signupThrottled", "subscription", "lastActiveDay", "birthdayUpdateSentAt", DEDUP_FIELD).get();
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
      if (!d?.birthdayUpdateSentAt) continue; // only people who got the 28 Aug email
      if (typeof d?.lastActiveDay === "string" && d.lastActiveDay >= ACTIVE_SINCE) continue; // saw the in-app banner
      if (isBadEmail(user.email)) continue;
      candidates.push({ uid: user.uid, email: user.email, name: (user.displayName || "").split(" ")[0] || "" });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  functions.logger.info("birthdayClosingSend: targeting", { count: candidates.length });
  if (opts.dryRun) return { sent: 0, failed: 0, targets: candidates.length, sample: candidates.slice(0, 5).map((c) => c.email) };

  const resend = getResend();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i += BATCH) {
    const chunk = candidates.slice(i, i + BATCH);
    try {
      const payload = await Promise.all(chunk.map(async (u) => {
        const unsubscribeUrl = getUnsubscribeUrl(u.uid);
        const html = await render(React.createElement(BirthdayLifetimeClosingEmail, { firstName: u.name, unsubscribeUrl }));
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
      functions.logger.info("birthdayClosingSend: batch ok", { from: i, sent });
    } catch (err) {
      failed += chunk.length;
      reportError(err, { fn: "birthdayClosingSend", batchStart: i });
    }
    await new Promise((r) => setTimeout(r, 1200)); // Resend: 2 req/s
  }

  functions.logger.info("birthdayClosingSend: done", { sent, failed });
  return { sent, failed };
}
