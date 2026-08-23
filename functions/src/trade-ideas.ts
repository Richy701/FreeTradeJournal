// Community trade ideas: a public feed of setups posted under a chosen
// @handle and avatar, with likes, reports and an optional outcome linked from
// the poster's own trade log.
//
// Every write goes through these callables. Clients only read:
//   tradeIdeas/{ideaId}              published ideas (+ the author's own hidden ones)
//   profiles/{uid}                   public handle, avatar and track record
//   handles/{handleLower}            existence = taken (no uid stored)
//   users/{uid}/meta/ideaLikes       { ids: string[] } so the feed knows what you liked
//   users/{uid}/meta/ideaModeration  { hiddenCount, reportedCount, postingBlocked } (owner read)
//
// Firestore rules deny all client writes to these collections.

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import type { Resend } from "resend";

type Tx = admin.firestore.Transaction;

export interface TradeIdeaDeps {
  db: admin.firestore.Firestore;
  reported: <D>(
    fn: string,
    handler: (data: D, context: functions.https.CallableContext) => Promise<unknown>,
  ) => (data: D, context: functions.https.CallableContext) => Promise<unknown>;
  captureServerEvent: (uid: string, event: string, properties?: Record<string, unknown>) => Promise<void>;
  getResend: () => Resend;
  escapeHtml: (s: string) => string;
  /** True for the founder/admin accounts (ADMIN_EMAILS in index.ts). */
  isAdmin: (context: functions.https.CallableContext) => boolean;
  fromEmail: string;
  supportEmail: string;
  appUrl: string;
}

export const IDEA_MARKETS = ["forex", "futures", "stocks", "crypto", "indices", "other"] as const;
export type IdeaMarket = (typeof IDEA_MARKETS)[number];
export type IdeaDirection = "long" | "short";
export type IdeaResult = "win" | "loss" | "breakeven";
export type IdeaStatus = "published" | "hidden";
/** "dev" marks the app's own team on the feed and unlocks moderation. */
export type IdeaRole = "dev" | null;
/** Ideas carry levels and an outcome; posts are plain team updates (dev only). */
export type IdeaKind = "idea" | "post";
export const IDEA_REPORT_REASONS = ["spam", "abuse", "misleading", "other"] as const;
export type IdeaReportReason = (typeof IDEA_REPORT_REASONS)[number];

export interface IdeaOutcome {
  result: IdeaResult;
  pnl: number;
  currency: string;
  closedAt: string; // ISO date of the linked trade's exit
  tradeId: string;
  linkedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

// Keep in sync with src/constants/avatars.ts
const AVATAR_COLORS = new Set([
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#14b8a6", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#64748b", "#0ea5e9",
]);
const AVATAR_EMOJIS = new Set([
  "🚀", "💎", "🦁", "🐯", "🦅", "🦊",
  "⚡", "🔥", "🏆", "👑", "🎯", "📈",
  "💰", "🌙", "⭐", "🧠", "💪", "🤖",
  "🎲", "🌊",
]);
const DEFAULT_AVATAR_COLOR = "#3b82f6";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;
// Handles containing any of these (case-insensitive) are refused so nobody
// can pose as the app or its founder.
const RESERVED_HANDLE_PARTS = [
  "admin", "moderator", "staff", "official", "support", "freetradejournal", "ftj",
  "coachftj", "demotrader", "richy", "richmond", "lamptey", "founder", "system",
];
const RESERVED_HANDLES_EXACT = new Set(["mod", "team", "help", "coach", "demo", "null", "undefined"]);
const SYMBOL_RE = /^[A-Z0-9][A-Z0-9.\/_\-:=!^]{0,14}$/;
const REASONING_MIN = 10;
const REASONING_MAX = 1000;
const POSTS_PER_DAY = 5;
const REPORTS_PER_DAY = 20;
const LIKE_TOGGLES_PER_DAY = 200;
const POST_COOLDOWN_MS = 60_000;
const HIDE_AT_REPORTS = 3;
// An account loses posting after this many of its ideas were hidden, or this
// many reports in total (so deleting an idea at two reports does not dodge it).
const BLOCK_AT_HIDDEN = 3;
const BLOCK_AT_REPORTS = 10;
const IMAGE_MAX_BYTES = 1_500_000;
// GIFs cannot be re-encoded on the client without losing the animation, so
// they arrive as-is with a higher cap. Base64 inflates this by a third, well
// under the 10 MB callable limit.
const GIF_MAX_BYTES = 4_000_000;
// GIFs picked from the search are stored by URL, not uploaded. Only GIPHY's
// CDN is accepted so nobody can turn the field into a hotlink to anything.
const GIPHY_GIF_RE = /^https:\/\/(media\d*|i)\.giphy\.com\/media\/[A-Za-z0-9._\-\/]+\.gif(\?[A-Za-z0-9=&._\-%]*)?$/;

function normalizeGifUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string" || raw.length > 600 || !GIPHY_GIF_RE.test(raw)) invalid("That GIF link is not from the GIF search.");
  return raw;
}
const IMAGE_MAX_SIDE = 4000;
const LIKED_IDS_CAP = 2000;
const PNL_MAX_ABS = 10_000_000;
const POST_TITLE_MAX = 120;
const POST_BODY_MAX = 2000;
const OUTCOME_BEFORE_IDEA_SLOP_MS = 60 * 60 * 1000;
const AVATAR_FANOUT_CAP = 500;

// Community rule "no selling": links, invites and referral-style URLs are
// rejected at post time. Text is normalised first so "www" with zero-width
// characters or full-width dots still match. It is a speed bump, not a wall.
const LINK_RE = /(https?:\/\/|www\.|\bt\.me\/|discord\.(gg|com)\/|wa\.me\/|bit\.ly\/|linktr\.ee\/|[a-z0-9-]+\.(com|net|io|gg|me|co|app|xyz|link)\b(\/|\s|$))/i;
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }
  return context.auth.uid;
}

// Posting, claiming and reporting need a verified email so throwaway
// password signups cannot be used for spam or report brigades.
function requireVerified(context: functions.https.CallableContext): string {
  const uid = requireAuth(context);
  if (context.auth!.token.email_verified !== true) {
    throw new functions.https.HttpsError("failed-precondition", "Verify your email address first. Check your inbox for the link from FreeTradeJournal.");
  }
  return uid;
}

function invalid(message: string): never {
  throw new functions.https.HttpsError("invalid-argument", message);
}

function asFinite(value: unknown, label: string, { optional = false } = {}): number | null {
  if (value === null || value === undefined || value === "") {
    if (optional) return null;
    invalid(`${label} is required.`);
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) invalid(`${label} must be a number.`);
  if (Math.abs(n) > 1e9) invalid(`${label} is out of range.`);
  return n;
}

function normalizeHandle(raw: unknown, { allowReserved = false } = {}): { handle: string; handleLower: string } {
  const handle = typeof raw === "string" ? raw.trim().replace(/^@/, "") : "";
  if (!HANDLE_RE.test(handle)) {
    invalid("Handles are 3 to 20 characters: letters, numbers and underscores.");
  }
  const handleLower = handle.toLowerCase();
  if (!allowReserved && (RESERVED_HANDLES_EXACT.has(handleLower) || RESERVED_HANDLE_PARTS.some((part) => handleLower.includes(part)))) {
    invalid("That handle is reserved.");
  }
  return { handle, handleLower };
}

function normalizeAvatar(raw: { avatarEmoji?: unknown; avatarColor?: unknown } | undefined) {
  const emoji = typeof raw?.avatarEmoji === "string" && AVATAR_EMOJIS.has(raw.avatarEmoji) ? raw.avatarEmoji : null;
  const color = typeof raw?.avatarColor === "string" && AVATAR_COLORS.has(raw.avatarColor) ? raw.avatarColor : DEFAULT_AVATAR_COLOR;
  return { avatarEmoji: emoji, avatarColor: color };
}

function cleanText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFKC")
    .replace(INVISIBLE_RE, "")
    .replace(CONTROL_RE, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeLink(text: string): boolean {
  const probe = text
    .replace(/\s*\[\s*(dot|\.)\s*\]\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".");
  return LINK_RE.test(probe);
}

// ─── Image checks ─────────────────────────────────────────
// The client resizes on a canvas, but anything can call the function, so the
// bytes are sniffed and the declared dimensions are read from the header.

function readImageDimensions(buf: Buffer, type: string): { width: number; height: number } | null {
  try {
    if (type === "image/png") {
      if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (type === "image/jpeg") {
      if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
        const len = buf.readUInt16BE(i + 2);
        const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        i += 2 + len;
      }
      return null;
    }
    if (type === "image/gif") {
      if (buf.length < 10) return null;
      const sig = buf.toString("ascii", 0, 6);
      if (sig !== "GIF87a" && sig !== "GIF89a") return null;
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (type === "image/webp") {
      if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
      const chunk = buf.toString("ascii", 12, 16);
      if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") {
        return {
          width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
          height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function decodeImage(raw: unknown): { buffer: Buffer; contentType: string } | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") invalid("Image must be a data URL.");
  const match = /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) invalid("Image must be a JPEG, PNG, WebP or GIF.");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0) invalid("Image is empty.");
  const contentType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  if (contentType === "image/gif") {
    if (buffer.length > GIF_MAX_BYTES) invalid("GIFs must be under 4 MB.");
  } else if (buffer.length > IMAGE_MAX_BYTES) {
    invalid("Image must be under 1.5 MB after compression.");
  }
  const dims = readImageDimensions(buffer, contentType);
  if (!dims) invalid("That file is not a readable image.");
  if (dims.width > IMAGE_MAX_SIDE || dims.height > IMAGE_MAX_SIDE) invalid("Image must be 4000 pixels or smaller on each side.");
  return { buffer, contentType };
}

export function createTradeIdeaFunctions(deps: TradeIdeaDeps) {
  const { db, reported, captureServerEvent, getResend, escapeHtml, isAdmin, fromEmail, supportEmail, appUrl } = deps;
  const roleFor = (context: functions.https.CallableContext): IdeaRole => (isAdmin(context) ? "dev" : null);

  const ideasCol = () => db.collection("tradeIdeas");
  const profileRef = (uid: string) => db.collection("profiles").doc(uid);
  const handleRef = (handleLower: string) => db.collection("handles").doc(handleLower);
  const metaRef = (uid: string, doc: string) => db.collection("users").doc(uid).collection("meta").doc(doc);
  const moderationRef = (uid: string) => metaRef(uid, "ideaModeration");

  // Daily counter under users/{uid}/meta/{doc}: { date, count, lastAt }. The
  // read must run before any write in the enclosing transaction.
  async function readDailyCounter(tx: Tx, ref: admin.firestore.DocumentReference) {
    const snap = await tx.get(ref);
    const date = todayKey();
    const data = snap.data();
    return { date, count: data?.date === date ? Number(data.count) || 0 : 0, lastAt: Number(data?.lastAt?.toMillis?.()) || 0 };
  }
  function writeDailyCounter(tx: Tx, ref: admin.firestore.DocumentReference, date: string, count: number) {
    tx.set(ref, { date, count, lastAt: admin.firestore.FieldValue.serverTimestamp() });
  }

  async function assertNotThrottled(uid: string, message: string) {
    const userSnap = await db.collection("users").doc(uid).get();
    if (userSnap.data()?.signupThrottled) {
      throw new functions.https.HttpsError("permission-denied", message);
    }
  }

  async function loadPosterProfile(uid: string) {
    const [userSnap, profileSnap, modSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      profileRef(uid).get(),
      moderationRef(uid).get(),
    ]);
    if (userSnap.data()?.signupThrottled) {
      throw new functions.https.HttpsError("permission-denied", "Posting is not available for this account.");
    }
    const profile = profileSnap.data();
    if (!profile?.handle) {
      throw new functions.https.HttpsError("failed-precondition", "Pick a handle before posting.");
    }
    const mod = modSnap.data();
    if (mod?.postingBlocked || (Number(mod?.hiddenCount) || 0) >= BLOCK_AT_HIDDEN || (Number(mod?.reportedCount) || 0) >= BLOCK_AT_REPORTS) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Posting is switched off for this account after repeated reports. Email support@freetradejournal.com if you think that is wrong.",
      );
    }
    return profile as { handle: string; handleLower: string; avatarEmoji?: string | null; avatarColor?: string; role?: IdeaRole };
  }

  function resultCounterField(result: IdeaResult): "winCount" | "lossCount" | "breakevenCount" {
    return result === "win" ? "winCount" : result === "loss" ? "lossCount" : "breakevenCount";
  }

  async function uploadIdeaImage(ideaId: string, image: { buffer: Buffer; contentType: string }): Promise<string> {
    const bucket = admin.storage().bucket();
    const ext = image.contentType === "image/png" ? "png" : image.contentType === "image/webp" ? "webp" : image.contentType === "image/gif" ? "gif" : "jpg";
    const path = `tradeIdeas/${ideaId}/chart.${ext}`;
    const token = crypto.randomUUID();
    await bucket.file(path).save(image.buffer, {
      contentType: image.contentType,
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  }

  async function deleteIdeaImages(ideaId: string) {
    try {
      await admin.storage().bucket().deleteFiles({ prefix: `tradeIdeas/${ideaId}/` });
    } catch (err) {
      console.error("tradeIdeas: image cleanup failed", ideaId, err);
    }
  }

  async function deleteIdeaSubcollections(ideaRef: admin.firestore.DocumentReference) {
    try {
      await db.recursiveDelete(ideaRef);
    } catch (err) {
      console.error("tradeIdeas: subcollection cleanup failed", ideaRef.id, err);
    }
  }

  // ─── claimHandle ───────────────────────────────────────────
  // One handle per account, claimed once. Uniqueness lives in handles/{lower}.
  const claimHandle = functions.https.onCall(reported<{ handle?: string; avatarEmoji?: string; avatarColor?: string }>(
    "claimHandle",
    async (data, context) => {
      const uid = requireVerified(context);
      const role = roleFor(context);
      const { handle, handleLower } = normalizeHandle(data?.handle, { allowReserved: role === "dev" });
      const avatar = normalizeAvatar(data);
      await assertNotThrottled(uid, "Handles are not available for this account.");

      await db.runTransaction(async (tx) => {
        const [existingProfile, existingHandle] = await Promise.all([tx.get(profileRef(uid)), tx.get(handleRef(handleLower))]);
        if (existingProfile.data()?.handle) {
          throw new functions.https.HttpsError("already-exists", "This account already has a handle.");
        }
        if (existingHandle.exists) {
          throw new functions.https.HttpsError("already-exists", "That handle is taken.");
        }
        const now = admin.firestore.FieldValue.serverTimestamp();
        tx.set(handleRef(handleLower), { createdAt: now });
        tx.set(profileRef(uid), {
          handle,
          handleLower,
          ...avatar,
          role,
          ideaCount: 0,
          winCount: 0,
          lossCount: 0,
          breakevenCount: 0,
          createdAt: now,
        });
      });

      await captureServerEvent(uid, "trade_idea_handle_claimed", { hasAvatar: !!avatar.avatarEmoji, role });
      return { handle, ...avatar, role };
    },
  ));

  // ─── updateIdeaAvatar ──────────────────────────────────────
  // Changes the avatar on the profile and on the poster's existing ideas.
  const updateIdeaAvatar = functions.https.onCall(reported<{ avatarEmoji?: string; avatarColor?: string }>(
    "updateIdeaAvatar",
    async (data, context) => {
      const uid = requireAuth(context);
      const avatar = normalizeAvatar(data);
      const profileSnap = await profileRef(uid).get();
      if (!profileSnap.data()?.handle) {
        throw new functions.https.HttpsError("failed-precondition", "Pick a handle first.");
      }
      await profileRef(uid).set({ ...avatar, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

      const ideas = await ideasCol().where("authorUid", "==", uid).limit(AVATAR_FANOUT_CAP).get();
      for (let i = 0; i < ideas.docs.length; i += 400) {
        const batch = db.batch();
        for (const doc of ideas.docs.slice(i, i + 400)) batch.update(doc.ref, avatar);
        await batch.commit();
      }

      await captureServerEvent(uid, "trade_idea_avatar_changed");
      return avatar;
    },
  ));

  // ─── postTradeIdea ─────────────────────────────────────────
  const postTradeIdea = functions.https.onCall(reported<{
    symbol?: string;
    market?: string;
    direction?: string;
    entry?: unknown;
    stop?: unknown;
    target?: unknown;
    reasoning?: string;
    image?: string | null;
    gifUrl?: string | null;
  }>("postTradeIdea", async (data, context) => {
    const uid = requireVerified(context);

    const symbol = typeof data?.symbol === "string" ? data.symbol.trim().toUpperCase() : "";
    if (!SYMBOL_RE.test(symbol)) invalid("Enter a symbol like NQ, EURUSD or AAPL.");

    const market = typeof data?.market === "string" ? data.market : "";
    if (!(IDEA_MARKETS as readonly string[]).includes(market)) invalid("Pick a market.");

    const direction = data?.direction;
    if (direction !== "long" && direction !== "short") invalid("Pick long or short.");

    const entry = asFinite(data?.entry, "Entry") as number;
    const stop = asFinite(data?.stop, "Stop") as number;
    const target = asFinite(data?.target, "Target", { optional: true });
    if (entry <= 0) invalid("Entry must be above zero.");
    if (stop <= 0) invalid("Stop must be above zero.");
    if (target !== null && target <= 0) invalid("Target must be above zero.");
    if (direction === "long") {
      if (stop >= entry) invalid("For a long, the stop goes below the entry.");
      if (target !== null && target <= entry) invalid("For a long, the target goes above the entry.");
    } else {
      if (stop <= entry) invalid("For a short, the stop goes above the entry.");
      if (target !== null && target >= entry) invalid("For a short, the target goes below the entry.");
    }

    const reasoning = cleanText(data?.reasoning);
    if (reasoning.length < REASONING_MIN) invalid("Say why you like this trade (at least 10 characters).");
    if (reasoning.length > REASONING_MAX) invalid("Keep the reasoning under 1,000 characters.");
    if (looksLikeLink(reasoning)) invalid("Links and invites are not allowed in ideas. Describe the setup instead.");

    const gifUrl = normalizeGifUrl(data?.gifUrl);
    const image = gifUrl ? null : decodeImage(data?.image);

    const profile = await loadPosterProfile(uid);
    const role = roleFor(context);
    if (profile.role !== role) {
      // Keeps the badge right if the admin list changes after the handle was claimed.
      await profileRef(uid).set({ role }, { merge: true });
    }

    // Cooldown + daily cap, both under the user's meta subcollection. The dev
    // account is exempt so the team can seed and test the feed.
    const usageRef = metaRef(uid, "ideaUsage");
    if (role !== "dev") {
      await db.runTransaction(async (tx) => {
        const usage = await readDailyCounter(tx, usageRef);
        if (Date.now() - usage.lastAt < POST_COOLDOWN_MS) {
          throw new functions.https.HttpsError("resource-exhausted", "Give it a minute before posting another idea.");
        }
        if (usage.count >= POSTS_PER_DAY) {
          throw new functions.https.HttpsError("resource-exhausted", `You can post ${POSTS_PER_DAY} ideas a day.`);
        }
        writeDailyCounter(tx, usageRef, usage.date, usage.count + 1);
      });
    }
    const refundSlot = () =>
      role === "dev"
        ? Promise.resolve()
        : usageRef
            .set({ count: admin.firestore.FieldValue.increment(-1), lastAt: admin.firestore.FieldValue.delete() }, { merge: true })
            .catch(() => undefined);

    const ideaRef = ideasCol().doc();
    let imageUrl: string | null = gifUrl;
    if (image) {
      try {
        imageUrl = await uploadIdeaImage(ideaRef.id, image);
      } catch (err) {
        console.error("postTradeIdea: image upload failed", err);
        await refundSlot();
        throw new functions.https.HttpsError("unavailable", "The chart image could not be saved. Try again without it.");
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      authorUid: uid,
      handle: profile.handle,
      handleLower: profile.handleLower,
      avatarEmoji: profile.avatarEmoji ?? null,
      avatarColor: profile.avatarColor ?? DEFAULT_AVATAR_COLOR,
      authorRole: role,
      kind: "idea" as IdeaKind,
      symbol,
      market,
      direction,
      entry,
      stop,
      target,
      reasoning,
      imageUrl,
      imageSource: gifUrl ? "giphy" : imageUrl ? "upload" : null,
      status: "published" as IdeaStatus,
      likeCount: 0,
      reportCount: 0,
      hiddenCounted: false,
      outcome: null as IdeaOutcome | null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const batch = db.batch();
      batch.set(ideaRef, doc);
      batch.set(profileRef(uid), { ideaCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
      await batch.commit();
    } catch (err) {
      if (imageUrl) await deleteIdeaImages(ideaRef.id);
      await refundSlot();
      throw err;
    }

    await captureServerEvent(uid, "trade_idea_posted", { market, direction, hasImage: !!imageUrl, hasGif: !!gifUrl, hasTarget: target !== null });
    return { id: ideaRef.id };
  }));

  // ─── postTeamUpdate ────────────────────────────────────────
  // Dev accounts can post a plain update to the feed: title, text, optional
  // image. No levels, no outcome, links allowed, no daily cap.
  const postTeamUpdate = functions.https.onCall(reported<{ title?: string; body?: string; image?: string | null; gifUrl?: string | null }>(
    "postTeamUpdate",
    async (data, context) => {
      const uid = requireVerified(context);
      if (!isAdmin(context)) throw new functions.https.HttpsError("permission-denied", "Team accounts only.");

      const title = cleanText(data?.title).replace(/\n+/g, " ").slice(0, POST_TITLE_MAX);
      const body = cleanText(data?.body);
      if (body.length < REASONING_MIN) invalid("Write at least a sentence.");
      if (body.length > POST_BODY_MAX) invalid(`Keep it under ${POST_BODY_MAX.toLocaleString("en-US")} characters.`);
      const gifUrl = normalizeGifUrl(data?.gifUrl);
      const image = gifUrl ? null : decodeImage(data?.image);

      const profileSnap = await profileRef(uid).get();
      const profile = profileSnap.data();
      if (!profile?.handle) throw new functions.https.HttpsError("failed-precondition", "Pick a handle before posting.");
      if (profile.role !== "dev") await profileRef(uid).set({ role: "dev" }, { merge: true });

      const ideaRef = ideasCol().doc();
      let imageUrl: string | null = gifUrl;
      if (image) {
        try {
          imageUrl = await uploadIdeaImage(ideaRef.id, image);
        } catch (err) {
          console.error("postTeamUpdate: image upload failed", err);
          throw new functions.https.HttpsError("unavailable", "The image could not be saved. Try again without it.");
        }
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      try {
        const batch = db.batch();
        batch.set(ideaRef, {
          authorUid: uid,
          handle: profile.handle,
          handleLower: profile.handleLower,
          avatarEmoji: profile.avatarEmoji ?? null,
          avatarColor: profile.avatarColor ?? DEFAULT_AVATAR_COLOR,
          authorRole: "dev" as IdeaRole,
          kind: "post" as IdeaKind,
          title: title || null,
          symbol: null,
          market: "other",
          direction: null,
          entry: null,
          stop: null,
          target: null,
          reasoning: body,
          imageUrl,
          imageSource: gifUrl ? "giphy" : imageUrl ? "upload" : null,
          status: "published" as IdeaStatus,
          likeCount: 0,
          reportCount: 0,
          hiddenCounted: false,
          outcome: null,
          createdAt: now,
          updatedAt: now,
        });
        batch.set(profileRef(uid), { ideaCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
        await batch.commit();
      } catch (err) {
        if (imageUrl) await deleteIdeaImages(ideaRef.id);
        throw err;
      }

      await captureServerEvent(uid, "trade_idea_team_update_posted", { hasImage: !!imageUrl, hasGif: !!gifUrl, hasTitle: !!title });
      return { id: ideaRef.id };
    },
  ));

  // ─── setIdeaOutcome ────────────────────────────────────────
  // Links (or unlinks) one of the poster's own logged trades. The trade lives
  // in the client's own storage, so the numbers are self-reported; the result
  // is derived from the P&L sign and the exit must fall after the idea.
  const setIdeaOutcome = functions.https.onCall(reported<{
    ideaId?: string;
    outcome?: { pnl?: unknown; currency?: string; closedAt?: string; tradeId?: string } | null;
  }>("setIdeaOutcome", async (data, context) => {
    const uid = requireAuth(context);
    const ideaId = typeof data?.ideaId === "string" ? data.ideaId : "";
    if (!ideaId || ideaId.length > 64) invalid("Idea not found.");

    let next: Omit<IdeaOutcome, "linkedAt"> | null = null;
    if (data?.outcome) {
      const o = data.outcome;
      const pnl = asFinite(o.pnl, "P&L") as number;
      if (Math.abs(pnl) > PNL_MAX_ABS) invalid("That P&L is out of range.");
      const result: IdeaResult = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";
      const currency = typeof o.currency === "string" ? o.currency.trim().toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(currency)) invalid("The trade's account has no currency set.");
      const closedMs = typeof o.closedAt === "string" ? Date.parse(o.closedAt) : NaN;
      if (Number.isNaN(closedMs)) invalid("The trade needs an exit date.");
      if (closedMs > Date.now() + 24 * 60 * 60 * 1000) invalid("The trade's exit date is in the future.");
      const tradeId = typeof o.tradeId === "string" ? o.tradeId.trim() : "";
      if (!tradeId || tradeId.length > 64) invalid("Pick a trade.");
      next = { result, pnl, currency, closedAt: new Date(closedMs).toISOString(), tradeId };
    }

    const ideaRef = ideasCol().doc(ideaId);
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ideaRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Idea not found.");
      const idea = snap.data()!;
      if (idea.authorUid !== uid) {
        throw new functions.https.HttpsError("permission-denied", "Only the poster can link a trade.");
      }
      if (idea.kind === "post") invalid("Team updates do not take a linked trade.");
      if (next) {
        const createdMs = Number(idea.createdAt?.toMillis?.()) || 0;
        if (createdMs && Date.parse(next.closedAt) < createdMs - OUTCOME_BEFORE_IDEA_SLOP_MS) {
          invalid("That trade closed before this idea was posted. Link a trade you took after posting.");
        }
      }
      const prev = idea.outcome as IdeaOutcome | null;
      const counters: Record<string, admin.firestore.FieldValue> = {};
      if (prev?.result && prev.result !== next?.result) counters[resultCounterField(prev.result)] = admin.firestore.FieldValue.increment(-1);
      if (next?.result && prev?.result !== next.result) counters[resultCounterField(next.result)] = admin.firestore.FieldValue.increment(1);
      tx.update(ideaRef, {
        outcome: next ? { ...next, linkedAt: admin.firestore.FieldValue.serverTimestamp() } : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (Object.keys(counters).length) tx.set(profileRef(uid), counters, { merge: true });
      return next;
    });

    await captureServerEvent(uid, next ? "trade_idea_outcome_linked" : "trade_idea_outcome_cleared", next ? { result: next.result } : undefined);
    return { outcome: result };
  }));

  // ─── toggleIdeaLike ────────────────────────────────────────
  const toggleIdeaLike = functions.https.onCall(reported<{ ideaId?: string }>("toggleIdeaLike", async (data, context) => {
    const uid = requireAuth(context);
    const ideaId = typeof data?.ideaId === "string" ? data.ideaId : "";
    if (!ideaId || ideaId.length > 64) invalid("Idea not found.");
    await assertNotThrottled(uid, "Likes are not available for this account.");

    const ideaRef = ideasCol().doc(ideaId);
    const likeRef = ideaRef.collection("likes").doc(uid);
    const likedRef = metaRef(uid, "ideaLikes");
    const usageRef = metaRef(uid, "ideaLikeUsage");

    const outcome = await db.runTransaction(async (tx) => {
      const [ideaSnap, likeSnap, likedSnap, usage] = await Promise.all([
        tx.get(ideaRef), tx.get(likeRef), tx.get(likedRef), readDailyCounter(tx, usageRef),
      ]);
      if (!ideaSnap.exists || ideaSnap.data()?.status !== "published") {
        throw new functions.https.HttpsError("not-found", "Idea not found.");
      }
      if (ideaSnap.data()?.authorUid === uid) {
        throw new functions.https.HttpsError("failed-precondition", "You cannot like your own idea.");
      }
      if (usage.count >= LIKE_TOGGLES_PER_DAY) {
        throw new functions.https.HttpsError("resource-exhausted", "That is enough likes for today.");
      }
      writeDailyCounter(tx, usageRef, usage.date, usage.count + 1);
      const ids: string[] = Array.isArray(likedSnap.data()?.ids) ? likedSnap.data()!.ids : [];
      const current = Number(ideaSnap.data()?.likeCount) || 0;
      if (likeSnap.exists) {
        tx.delete(likeRef);
        tx.update(ideaRef, { likeCount: admin.firestore.FieldValue.increment(-1) });
        tx.set(likedRef, { ids: ids.filter((id) => id !== ideaId) });
        return { liked: false, likeCount: Math.max(0, current - 1) };
      }
      tx.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      tx.update(ideaRef, { likeCount: admin.firestore.FieldValue.increment(1) });
      tx.set(likedRef, { ids: [...ids.filter((id) => id !== ideaId), ideaId].slice(-LIKED_IDS_CAP) });
      return { liked: true, likeCount: current + 1 };
    });

    if (outcome.liked) await captureServerEvent(uid, "trade_idea_liked");
    return outcome;
  }));

  // ─── reportTradeIdea ───────────────────────────────────────
  // One report per user per idea. Three distinct reports hide the idea and
  // count one strike against the poster; total reports count too, so deleting
  // at two reports and reposting does not reset anything. Support is emailed
  // on the first report and again when the idea is hidden.
  const reportTradeIdea = functions.https.onCall(reported<{ ideaId?: string; reason?: string; note?: string }>(
    "reportTradeIdea",
    async (data, context) => {
      const uid = requireVerified(context);
      const ideaId = typeof data?.ideaId === "string" ? data.ideaId : "";
      if (!ideaId || ideaId.length > 64) invalid("Idea not found.");
      const reason = typeof data?.reason === "string" ? data.reason : "";
      if (!(IDEA_REPORT_REASONS as readonly string[]).includes(reason)) invalid("Pick a reason.");
      const note = cleanText(data?.note).slice(0, 300);
      await assertNotThrottled(uid, "Reports are not available for this account.");

      const ideaRef = ideasCol().doc(ideaId);
      const reportRef = ideaRef.collection("reports").doc(uid);
      const usageRef = metaRef(uid, "ideaReportUsage");

      const summary = await db.runTransaction(async (tx) => {
        const [ideaSnap, reportSnap, usage] = await Promise.all([tx.get(ideaRef), tx.get(reportRef), readDailyCounter(tx, usageRef)]);
        if (!ideaSnap.exists) throw new functions.https.HttpsError("not-found", "Idea not found.");
        const idea = ideaSnap.data()!;
        if (idea.authorUid === uid) invalid("You can delete your own idea instead.");
        if (reportSnap.exists) return { alreadyReported: true, hidden: idea.status === "hidden", justHidden: false, idea, reportCount: Number(idea.reportCount) || 0 };
        if (usage.count >= REPORTS_PER_DAY) {
          throw new functions.https.HttpsError("resource-exhausted", "That is enough reports for today.");
        }
        writeDailyCounter(tx, usageRef, usage.date, usage.count + 1);

        const reportCount = (Number(idea.reportCount) || 0) + 1;
        const hide = reportCount >= HIDE_AT_REPORTS && idea.status === "published" && idea.authorRole !== "dev";
        const countStrike = hide && !idea.hiddenCounted;
        tx.set(reportRef, { reason, note, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.update(ideaRef, {
          reportCount,
          ...(hide ? { status: "hidden" as IdeaStatus, hiddenAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
          ...(countStrike ? { hiddenCounted: true } : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(
          moderationRef(idea.authorUid),
          {
            reportedCount: admin.firestore.FieldValue.increment(1),
            ...(countStrike ? { hiddenCount: admin.firestore.FieldValue.increment(1) } : {}),
          },
          { merge: true },
        );
        return { alreadyReported: false, hidden: hide || idea.status === "hidden", justHidden: hide, idea, reportCount };
      });

      if (!summary.alreadyReported && (summary.reportCount === 1 || summary.justHidden)) {
        const idea = summary.idea;
        try {
          await getResend().emails.send({
            from: fromEmail,
            to: supportEmail,
            subject: `${summary.justHidden ? "[HIDDEN] " : ""}Trade idea reported: ${idea.symbol} ${idea.direction} by @${idea.handle}`,
            html: `
              <p><strong>Reason:</strong> ${escapeHtml(reason)}${note ? ` &mdash; ${escapeHtml(note)}` : ""}</p>
              <p><strong>Reports:</strong> ${summary.reportCount} (auto-hides at ${HIDE_AT_REPORTS})${summary.justHidden ? " &mdash; now hidden" : ""}</p>
              <p><strong>Idea:</strong> ${escapeHtml(idea.symbol)} ${escapeHtml(idea.direction)} @ ${idea.entry}${idea.stop != null ? `, stop ${idea.stop}` : ""}${idea.target != null ? `, target ${idea.target}` : ""}</p>
              <p>${escapeHtml(String(idea.reasoning || "")).replace(/\n/g, "<br>")}</p>
              ${idea.imageUrl ? `<p><a href="${escapeHtml(idea.imageUrl)}">Chart image</a></p>` : ""}
              <p style="color:#666;font-size:12px">Idea ${escapeHtml(ideaId)} by uid ${escapeHtml(String(idea.authorUid))}, reported by uid ${escapeHtml(uid)}.<br>
              Unhide: set <code>tradeIdeas/${escapeHtml(ideaId)}.status</code> to <code>published</code> and <code>reportCount</code> to <code>0</code>.
              Delete: remove the document; images and likes clean up automatically.
              Poster strikes: <code>users/${escapeHtml(String(idea.authorUid))}/meta/ideaModeration</code> (posting stops at ${BLOCK_AT_HIDDEN} hidden or ${BLOCK_AT_REPORTS} reports; set <code>postingBlocked: false</code> and reset the counts to lift it).
              <a href="${escapeHtml(appUrl)}/trade-ideas">Open the feed</a>.</p>
            `,
          });
        } catch (err) {
          console.error("reportTradeIdea: support email failed", err);
        }
      }
      if (!summary.alreadyReported) {
        await captureServerEvent(uid, "trade_idea_reported", { reason, hidden: summary.hidden });
      }

      return { hidden: summary.hidden, alreadyReported: summary.alreadyReported };
    },
  ));

  // ─── deleteTradeIdea ───────────────────────────────────────
  const deleteTradeIdea = functions.https.onCall(reported<{ ideaId?: string }>("deleteTradeIdea", async (data, context) => {
    const uid = requireAuth(context);
    const ideaId = typeof data?.ideaId === "string" ? data.ideaId : "";
    if (!ideaId || ideaId.length > 64) invalid("Idea not found.");

    const ideaRef = ideasCol().doc(ideaId);
    const asModerator = isAdmin(context);
    const authorUid = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ideaRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Idea not found.");
      const idea = snap.data()!;
      if (idea.authorUid !== uid && !asModerator) {
        throw new functions.https.HttpsError("permission-denied", "Only the poster can delete an idea.");
      }
      const counters: Record<string, admin.firestore.FieldValue> = {
        ideaCount: admin.firestore.FieldValue.increment(-1),
      };
      const prev = idea.outcome as IdeaOutcome | null;
      if (prev?.result) counters[resultCounterField(prev.result)] = admin.firestore.FieldValue.increment(-1);
      tx.set(profileRef(idea.authorUid), counters, { merge: true });
      tx.delete(ideaRef);
      return idea.authorUid as string;
    });

    // The onDelete trigger also does this; running it here too means the
    // caller does not see a stale image if the trigger is slow.
    await deleteIdeaSubcollections(ideaRef);
    await deleteIdeaImages(ideaId);

    await captureServerEvent(uid, "trade_idea_deleted", { byModerator: asModerator && authorUid !== uid });
    return { ok: true };
  }));

  // ─── moderateTradeIdea ─────────────────────────────────────
  // Dev accounts can hide or unhide any idea from the card menu instead of
  // editing Firestore by hand. Unhiding also resets the report count so the
  // same three reports cannot re-hide it instantly.
  const moderateTradeIdea = functions.https.onCall(reported<{ ideaId?: string; action?: string }>(
    "moderateTradeIdea",
    async (data, context) => {
      const uid = requireAuth(context);
      if (!isAdmin(context)) throw new functions.https.HttpsError("permission-denied", "Moderators only.");
      const ideaId = typeof data?.ideaId === "string" ? data.ideaId : "";
      if (!ideaId || ideaId.length > 64) invalid("Idea not found.");
      const action = data?.action;
      if (action !== "hide" && action !== "unhide") invalid("Pick hide or unhide.");

      const ideaRef = ideasCol().doc(ideaId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ideaRef);
        if (!snap.exists) throw new functions.https.HttpsError("not-found", "Idea not found.");
        const idea = snap.data()!;
        if (action === "hide") {
          tx.update(ideaRef, {
            status: "hidden" as IdeaStatus,
            hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
            hiddenBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          if (!idea.hiddenCounted) {
            tx.update(ideaRef, { hiddenCounted: true });
            tx.set(moderationRef(idea.authorUid), { hiddenCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
          }
        } else {
          tx.update(ideaRef, {
            status: "published" as IdeaStatus,
            reportCount: 0,
            unhiddenAt: admin.firestore.FieldValue.serverTimestamp(),
            unhiddenBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      await captureServerEvent(uid, "trade_idea_moderated", { action });
      return { status: action === "hide" ? "hidden" : "published" };
    },
  ));

  // ─── onTradeIdeaDeleted ────────────────────────────────────
  // Console deletes and callable deletes share one cleanup path.
  const onTradeIdeaDeleted = functions.firestore.document("tradeIdeas/{ideaId}").onDelete(async (_snap, context) => {
    const ideaId = context.params.ideaId as string;
    await deleteIdeaSubcollections(ideasCol().doc(ideaId));
    await deleteIdeaImages(ideaId);
  });

  // ─── cleanupUserTradeIdeas ─────────────────────────────────
  // Called from deleteUserAccount: removes the user's ideas, profile and
  // handle so nothing public outlives the account. Likes/reports they left on
  // other ideas carry no personal data and are left in place.
  async function cleanupUserTradeIdeas(uid: string): Promise<void> {
    const ideas = await ideasCol().where("authorUid", "==", uid).get();
    for (const doc of ideas.docs) {
      try {
        await doc.ref.delete();
        await deleteIdeaSubcollections(doc.ref);
        await deleteIdeaImages(doc.id);
      } catch (err) {
        console.error("cleanupUserTradeIdeas: idea delete failed", doc.id, err);
      }
    }
    const profileSnap = await profileRef(uid).get();
    const handleLower = profileSnap.data()?.handleLower;
    if (typeof handleLower === "string" && handleLower) {
      await handleRef(handleLower).delete().catch((err) => console.error("cleanupUserTradeIdeas: handle delete failed", err));
    }
    await profileRef(uid).delete().catch((err) => console.error("cleanupUserTradeIdeas: profile delete failed", err));
  }

  return {
    claimHandle,
    updateIdeaAvatar,
    postTradeIdea,
    postTeamUpdate,
    setIdeaOutcome,
    toggleIdeaLike,
    reportTradeIdea,
    deleteTradeIdea,
    moderateTradeIdea,
    onTradeIdeaDeleted,
    cleanupUserTradeIdeas,
  };
}
