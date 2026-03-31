"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncData = exports.syncData = exports.aiAssist = exports.analyzeTradesAI = exports.stripeWebhook = exports.createPortalSession = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
// ─── Stripe Integration ────────────────────────────────────
let _stripe;
function getStripe() {
    if (!_stripe) {
        _stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2025-01-27.acacia",
        });
    }
    return _stripe;
}
function getPlanTypeFromPriceId(priceId) {
    if (priceId === process.env.STRIPE_PRICE_MONTHLY)
        return "monthly";
    if (priceId === process.env.STRIPE_PRICE_YEARLY)
        return "yearly";
    return "lifetime";
}
function mapStripeStatus(stripeStatus) {
    const statusMap = {
        active: "active",
        trialing: "on_trial",
        past_due: "past_due",
        canceled: "cancelled",
        unpaid: "unpaid",
        paused: "paused",
        incomplete: "past_due",
        incomplete_expired: "expired",
    };
    return statusMap[stripeStatus] || "expired";
}
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }
    const priceId = (data.priceId || "").trim();
    if (!priceId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing priceId.");
    }
    // Validate priceId against allowed values to prevent use of arbitrary Stripe prices
    const ALLOWED_PRICES = [
        process.env.STRIPE_PRICE_MONTHLY,
        process.env.STRIPE_PRICE_YEARLY,
        process.env.STRIPE_PRICE_LIFETIME,
    ].filter(Boolean);
    if (!ALLOWED_PRICES.includes(priceId)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid price.");
    }
    const uid = context.auth.uid;
    const email = context.auth.token.email || "";
    // Look up or create Stripe customer
    const userDoc = await db.collection("users").doc(uid).get();
    let stripeCustomerId = userDoc.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = await getStripe().customers.create({
            email,
            metadata: { firebase_uid: uid },
        });
        stripeCustomerId = customer.id;
        await db.collection("users").doc(uid).set({ stripeCustomerId }, { merge: true });
    }
    const isLifetime = priceId === process.env.STRIPE_PRICE_LIFETIME;
    const sessionParams = {
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: isLifetime ? "payment" : "subscription",
        success_url: `${process.env.APP_URL}/settings?tab=subscription&checkout=success`,
        cancel_url: `${process.env.APP_URL}/pricing`,
        allow_promotion_codes: true,
        metadata: { firebase_uid: uid },
    };
    if (!isLifetime) {
        sessionParams.subscription_data = {
            metadata: { firebase_uid: uid },
        };
    }
    else {
        sessionParams.payment_intent_data = {
            metadata: { firebase_uid: uid },
        };
    }
    const session = await getStripe().checkout.sessions.create(sessionParams);
    return { url: session.url };
});
exports.createPortalSession = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = context.auth.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
        throw new functions.https.HttpsError("not-found", "No subscription found for this account.");
    }
    const session = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.APP_URL}/settings?tab=subscription`,
    });
    return { url: session.url };
});
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
    }
    let event;
    try {
        event = getStripe().webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const firebaseUid = session.metadata?.firebase_uid;
                if (!firebaseUid) {
                    console.error("No firebase_uid in session metadata");
                    break;
                }
                const customerId = session.customer;
                let subscriptionData;
                if (session.mode === "subscription") {
                    const sub = await getStripe().subscriptions.retrieve(session.subscription);
                    const priceId = sub.items.data[0]?.price.id || "";
                    subscriptionData = {
                        status: "active",
                        planType: getPlanTypeFromPriceId(priceId),
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: sub.id,
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                }
                else {
                    // payment mode = lifetime
                    subscriptionData = {
                        status: "active",
                        planType: "lifetime",
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: null,
                        currentPeriodEnd: null,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                }
                await db.collection("users").doc(firebaseUid).set({
                    isPro: true,
                    stripeCustomerId: customerId,
                    subscription: subscriptionData,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`checkout.session.completed for ${firebaseUid}`, subscriptionData.planType);
                break;
            }
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const firebaseUid = sub.metadata?.firebase_uid;
                if (!firebaseUid) {
                    console.error("No firebase_uid in subscription metadata");
                    break;
                }
                const priceId = sub.items.data[0]?.price.id || "";
                const status = mapStripeStatus(sub.status);
                const isPro = status === "active" || status === "on_trial";
                await db.collection("users").doc(firebaseUid).set({
                    isPro,
                    subscription: {
                        status,
                        planType: getPlanTypeFromPriceId(priceId),
                        stripeCustomerId: sub.customer,
                        stripeSubscriptionId: sub.id,
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`subscription.updated for ${firebaseUid}: ${status}`);
                break;
            }
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                const firebaseUid = sub.metadata?.firebase_uid;
                if (!firebaseUid) {
                    console.error("No firebase_uid in subscription metadata");
                    break;
                }
                await db.collection("users").doc(firebaseUid).set({
                    isPro: false,
                    subscription: {
                        status: "expired",
                        stripeSubscriptionId: sub.id,
                        updatedAt: new Date().toISOString(),
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`subscription.deleted for ${firebaseUid}`);
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                if (!invoice.subscription)
                    break;
                const sub = await getStripe().subscriptions.retrieve(invoice.subscription);
                const firebaseUid = sub.metadata?.firebase_uid;
                if (!firebaseUid)
                    break;
                await db.collection("users").doc(firebaseUid).set({
                    subscription: {
                        status: "past_due",
                        updatedAt: new Date().toISOString(),
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
                console.log(`invoice.payment_failed for ${firebaseUid}`);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }
    catch (err) {
        console.error("Error processing webhook:", err.message);
        res.status(500).send("Webhook handler error");
        return;
    }
    res.status(200).json({ received: true });
});
// Rate limits per feature type
const RATE_LIMITS = {
    ai_analysis: 10, // Heavy - uses GPT-4o
    goal_coach: 10, // Heavy - uses GPT-4o
    trade_review: 25, // Heavy - uses GPT-4o
    prop_tracker: 5, // Heavy - uses GPT-4o
    coaching_tips: 15, // Light - uses GPT-4o-mini
    journal_prompts: 50, // Light - uses GPT-4o-mini
    risk_alert: 25, // Light - uses GPT-4o-mini
    strategy_tagger: 25, // Light - uses GPT-4o-mini (375 trades/day with batches of 15)
};
// Model selection per feature type
const FEATURE_MODELS = {
    ai_analysis: "gpt-4o",
    goal_coach: "gpt-4o",
    trade_review: "gpt-4o",
    prop_tracker: "gpt-4o",
    coaching_tips: "gpt-4o-mini",
    journal_prompts: "gpt-4o-mini",
    risk_alert: "gpt-4o-mini",
    strategy_tagger: "gpt-4o-mini",
};
exports.analyzeTradesAI = functions.https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
    }
    const uid = context.auth.uid;
    // 2. Pro check
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isPro) {
        throw new functions.https.HttpsError("permission-denied", "AI Analysis is a Pro feature.");
    }
    // 3. Rate limit check (don't update yet - will update after successful API call)
    const usageRef = db.collection("users").doc(uid).collection("meta").doc("aiUsage");
    const usageDoc = await usageRef.get();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const usageData = usageDoc.exists ? usageDoc.data() : null;
    let usedToday = 0;
    if (usageData && usageData.date === todayStr && usageData.ai_analysis) {
        usedToday = usageData.ai_analysis || 0;
    }
    const limit = RATE_LIMITS.ai_analysis;
    if (usedToday >= limit) {
        throw new functions.https.HttpsError("resource-exhausted", `Daily AI Trade Analysis limit reached (${limit}/day). Resets at midnight UTC.`);
    }
    // 4. Validate input
    const request = data;
    if (!request.trades || !Array.isArray(request.trades) || request.trades.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "No trades provided.");
    }
    // Cap at 50 trades to keep prompt size reasonable
    const trades = request.trades.slice(0, 50);
    // 5. Build prompt — compute detailed stats for richer analysis
    const tradesSummary = trades.map((t, i) => {
        const hold = Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000);
        const holdStr = hold >= 60 ? `${Math.floor(hold / 60)}h ${hold % 60}m` : `${hold}m`;
        const entryHour = new Date(t.entryTime).getUTCHours();
        const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(t.entryTime).getUTCDay()];
        return `${i + 1}. ${t.symbol} ${t.side.toUpperCase()} | Entry: ${t.entryPrice} → Exit: ${t.exitPrice} | Lots: ${t.lotSize} | P&L: $${t.pnl.toFixed(2)} | Hold: ${holdStr} | Entered: ${dayOfWeek} ${entryHour}:00 UTC${t.strategy ? ` | Strategy: ${t.strategy}` : ""}${t.riskReward ? ` | R:R ${t.riskReward.toFixed(1)}` : ""}`;
    }).join("\n");
    const wins = trades.filter((t) => t.pnl > 0).length;
    const losses = trades.filter((t) => t.pnl < 0).length;
    const breakeven = trades.filter((t) => t.pnl === 0).length;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgWin = wins > 0 ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
    const avgLoss = losses > 0 ? trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / losses : 0;
    const largestWin = Math.max(...trades.map((t) => t.pnl));
    const largestLoss = Math.min(...trades.map((t) => t.pnl));
    const avgHoldMins = Math.round(trades.reduce((s, t) => s + (new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000, 0) / trades.length);
    const symbols = [...new Set(trades.map((t) => t.symbol))];
    const longCount = trades.filter((t) => t.side === "long").length;
    const shortCount = trades.filter((t) => t.side === "short").length;
    const longPnl = trades.filter((t) => t.side === "long").reduce((s, t) => s + t.pnl, 0);
    const shortPnl = trades.filter((t) => t.side === "short").reduce((s, t) => s + t.pnl, 0);
    // Streak calculation
    let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
    for (const t of trades) {
        if (t.pnl > 0) {
            curWin++;
            curLoss = 0;
            maxWinStreak = Math.max(maxWinStreak, curWin);
        }
        else if (t.pnl < 0) {
            curLoss++;
            curWin = 0;
            maxLossStreak = Math.max(maxLossStreak, curLoss);
        }
        else {
            curWin = 0;
            curLoss = 0;
        }
    }
    const systemPrompt = `You are an elite trading performance coach with 20+ years of experience analysing retail and prop firm traders. You're known for giving specific, data-backed insights that traders can immediately act on. You don't give generic advice — every observation must reference specific trades, numbers, or patterns from the data.

Your analysis style:
- Speak directly to the trader ("You tend to...", "Your best trades...")
- Use specific trade numbers and symbols when making points
- Compare their stats to typical retail trader benchmarks where relevant
- Be honest about weaknesses but frame them as opportunities
- Give actionable next steps, not vague suggestions

Structure your response in markdown with these sections:

## Performance Snapshot
A quick 2-3 sentence overview of where this trader stands. Include their win rate vs the typical 40-50% retail benchmark, and whether their risk:reward compensates.

## Key Patterns Detected
3-4 specific patterns with evidence. Look for:
- Time-of-day and day-of-week performance differences
- Symbol-specific edge (which instruments they trade best/worst)
- Long vs short bias and which direction is more profitable
- Position sizing patterns (do they size up on winners or losers?)
- Hold time patterns (are quick trades or longer holds more profitable?)
- Consecutive loss behaviour (do they revenge trade or stay disciplined?)

## Strengths to Double Down On
2-3 concrete things they're doing well, with specific examples from trades

## Critical Improvements
2-3 high-impact changes ranked by potential impact. For each:
- What the problem is (with data)
- Why it matters
- Exactly what to do differently

## Action Plan
3 specific, measurable goals for their next 20 trades (e.g., "Only take EUR/USD longs during London session" or "Cap max loss per trade at $X").

Keep the tone like a knowledgeable mentor who genuinely wants to help. Be thorough — this analysis is a premium Pro feature that traders are paying for.`;
    const userPrompt = `Here are my ${trades.length} trades to analyse:

TRADES:
${tradesSummary}

COMPUTED STATS:
- Win/Loss/BE: ${wins}W / ${losses}L / ${breakeven}BE (${(wins / trades.length * 100).toFixed(1)}% win rate)
- Net P&L: $${totalPnl.toFixed(2)}
- Avg Win: $${avgWin.toFixed(2)} | Avg Loss: $${avgLoss.toFixed(2)} | Ratio: ${avgLoss !== 0 ? (Math.abs(avgWin / avgLoss)).toFixed(2) : "N/A"}
- Largest Win: $${largestWin.toFixed(2)} | Largest Loss: $${largestLoss.toFixed(2)}
- Avg Hold Time: ${avgHoldMins >= 60 ? `${Math.floor(avgHoldMins / 60)}h ${avgHoldMins % 60}m` : `${avgHoldMins}m`}
- Direction: ${longCount} longs ($${longPnl.toFixed(2)}) vs ${shortCount} shorts ($${shortPnl.toFixed(2)})
- Symbols traded: ${symbols.join(", ")}
- Best win streak: ${maxWinStreak} | Worst loss streak: ${maxLossStreak}

Give me a thorough analysis of my trading.`;
    // 6. Call OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
        throw new functions.https.HttpsError("internal", "OpenAI API key not configured.");
    }
    const openai = new openai_1.default({ apiKey });
    let analysis;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });
        analysis = completion.choices[0]?.message?.content || "No analysis generated.";
    }
    catch (err) {
        console.error("OpenAI API error:", err.message);
        throw new functions.https.HttpsError("internal", "Failed to generate analysis. Please try again.");
    }
    // 7. Update rate limit
    await usageRef.set({
        date: todayStr,
        ai_analysis: usedToday + 1,
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
        analysis,
        usage: {
            used: usedToday + 1,
            limit,
            remaining: limit - (usedToday + 1),
        },
    };
});
function buildJournalPromptsPrompt(payload) {
    const { symbol, side, pnl, entryPrice, exitPrice, strategy, riskReward, holdTimeMinutes } = payload;
    const holdStr = holdTimeMinutes >= 60 ? `${Math.floor(holdTimeMinutes / 60)}h ${holdTimeMinutes % 60}m` : `${Math.round(holdTimeMinutes)}m`;
    const outcome = pnl > 0 ? "winning" : pnl < 0 ? "losing" : "breakeven";
    return {
        system: `You are a trading psychology coach. A trader just logged a trade and you need to help them reflect on it through targeted journaling questions. Generate 4 thought-provoking questions that help the trader examine their decision-making process, emotional state, and lessons learned from this specific trade. Questions should be specific to the trade details — not generic. Format as a numbered list. Keep each question to 1-2 sentences.`,
        user: `I just closed a ${outcome} ${side} trade on ${symbol}. Entry: ${entryPrice} → Exit: ${exitPrice}. P&L: $${pnl.toFixed(2)}. Hold time: ${holdStr}.${strategy ? ` Strategy: ${strategy}.` : ""}${riskReward ? ` R:R: ${riskReward.toFixed(1)}.` : ""}\n\nGenerate reflective journaling questions for this trade.`,
        maxTokens: 300,
        temperature: 0.8,
    };
}
function buildTradeReviewPrompt(payload) {
    const { symbol, side, entryPrice, exitPrice, lotSize, pnl, entryTime, exitTime, strategy, riskReward, notes, recentTrades } = payload;
    const hold = Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000);
    const holdStr = hold >= 60 ? `${Math.floor(hold / 60)}h ${hold % 60}m` : `${hold}m`;
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(entryTime).getUTCDay()];
    const hour = new Date(entryTime).getUTCHours();
    let context = "";
    if (recentTrades && recentTrades.length > 0) {
        context = "\n\nSurrounding trades for context:\n" + recentTrades.map((t, i) => `${i + 1}. ${t.symbol} ${t.side} P&L: $${t.pnl?.toFixed(2) || "0.00"}`).join("\n");
    }
    return {
        system: `You are an expert trade reviewer. Analyse this single trade and provide specific, actionable feedback. Structure your response in markdown:

## Trade Grade
Give a letter grade (A+ to F) with a one-line justification.

## What Went Well
1-2 specific positives about the trade execution.

## What Could Improve
1-2 specific areas with actionable advice tied to the trade data.

## Key Takeaway
One sentence the trader should remember from this trade.

Be direct and reference the actual numbers. Keep the total under 250 words.`,
        user: `Review this trade:\n${symbol} ${side.toUpperCase()} | Entry: ${entryPrice} → Exit: ${exitPrice} | Lots: ${lotSize} | P&L: $${pnl.toFixed(2)} | Hold: ${holdStr} | ${dayOfWeek} ${hour}:00 UTC${strategy ? ` | Strategy: ${strategy}` : ""}${riskReward ? ` | R:R: ${riskReward.toFixed(1)}` : ""}${notes ? `\nTrader notes: ${notes}` : ""}${context}`,
        maxTokens: 500,
        temperature: 0.7,
    };
}
function buildRiskAlertPrompt(payload) {
    const { violationType, ruleValue, actualValue, recentTrades, currentStreak, todayPnL } = payload;
    const tradesSummary = (recentTrades || []).slice(0, 10).map((t, i) => {
        return `${i + 1}. ${t.symbol} ${t.side} P&L: $${t.pnl?.toFixed(2) || "0.00"}`;
    }).join("\n");
    const violationDesc = {
        maxLossPerDay: `daily loss limit of $${ruleValue} exceeded (actual: $${Math.abs(actualValue).toFixed(2)})`,
        consecutiveLosses: `${currentStreak} consecutive losing trades`,
        revengeTrading: `possible revenge trading detected — quick re-entry after a loss`,
    };
    return {
        system: `You are a trading risk manager. A trader has triggered a risk alert. Provide a firm but supportive warning with specific advice. Structure as:

## Warning
1-2 sentences on what happened and why it's dangerous.

## What to Do Right Now
2-3 immediate, concrete actions (e.g., "Step away for 30 minutes", "Review your last 3 trades before entering another").

## Perspective
1 sentence of encouragement — risk management is a skill they're building.

Keep it under 150 words. Be direct.`,
        user: `Risk alert: ${violationDesc[violationType] || violationType}.\nToday's P&L: $${todayPnL?.toFixed(2) || "0.00"}\n\nRecent trades:\n${tradesSummary}`,
        maxTokens: 400,
        temperature: 0.6,
    };
}
function buildStrategyTaggerPrompt(payload) {
    const { trades } = payload;
    const tradesList = (trades || []).slice(0, 15).map((t) => {
        const hold = Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000);
        const pnlPct = t.entryPrice > 0 ? ((t.exitPrice - t.entryPrice) / t.entryPrice * 100 * (t.side === "short" ? -1 : 1)).toFixed(2) : "0";
        return `{id:"${t.id}",sym:"${t.symbol}",side:"${t.side}",entry:${t.entryPrice},exit:${t.exitPrice},pnl:${t.pnl?.toFixed(2)},hold:${hold}m,move:${pnlPct}%${t.riskReward ? `,rr:${t.riskReward.toFixed(1)}` : ""}}`;
    }).join("\n");
    return {
        system: `You classify trades into strategy categories based on price action characteristics. Categories: breakout, pullback, reversal, momentum, range, scalp, news, trend-follow, other.

Rules:
- Short hold times (<10m) with small moves → scalp
- Trades following direction of larger move → trend-follow or momentum
- Trades entering at support/resistance bounces → reversal or range
- Large sudden moves → breakout or news
- Trades entering after a retracement in trend direction → pullback

Return ONLY valid JSON array. No markdown, no explanation. Format:
[{"id":"tradeId","strategy":"category","confidence":0.85}]`,
        user: `Classify these trades:\n${tradesList}`,
        maxTokens: 600, // Reduced for 15 trades batch size (fits character limit)
        temperature: 0.3,
    };
}
function buildGoalCoachPrompt(payload) {
    const { goals, riskRules, stats, tradeCount, daysSinceStart } = payload;
    const goalsSummary = (goals || []).map((g) => `- ${g.type} (${g.period}): target ${g.target}, current ${g.current?.toFixed?.(2) ?? g.current}, ${g.achieved ? "ACHIEVED" : `${g.percentComplete?.toFixed(0)}% complete`}`).join("\n");
    const rulesSummary = (riskRules || []).map((r) => `- ${r.type}: limit ${r.value}, violations: ${r.violations || 0}`).join("\n");
    return {
        system: `You are an elite trading goal coach. Analyse the trader's goal progress and provide specific coaching advice. Structure your response:

## Progress Overview
2-3 sentences summarising where they stand on their goals overall.

## Goal-by-Goal Insights
For each goal, one specific observation or suggestion (what's working, what to adjust, realistic targets).

## Recommended Adjustments
2-3 specific, actionable changes to goals or approach based on the data. Reference actual numbers.

## Motivation
1-2 sentences of genuine encouragement tied to their actual progress — not generic platitudes.

Keep under 350 words. Be data-driven and specific.`,
        user: `My trading goals:\n${goalsSummary || "No goals set"}\n\nRisk rules:\n${rulesSummary || "No rules set"}\n\nStats: ${tradeCount} trades over ${daysSinceStart} days. Win rate: ${stats?.winRate?.toFixed(1) || "N/A"}%. Avg R:R: ${stats?.avgRR?.toFixed(2) || "N/A"}. Profit factor: ${stats?.profitFactor?.toFixed(2) || "N/A"}. Total P&L: $${stats?.totalPnL?.toFixed(2) || "0.00"}.\n\nCoach me on my goals.`,
        maxTokens: 500,
        temperature: 0.7,
    };
}
function buildCoachingTipsPrompt(payload) {
    const { trades, winRate, avgPnl, totalPnl, consecutiveLosses, bestSymbol, worstSymbol, avgHoldMinutes, tradeCount } = payload;
    const recentSummary = (trades || []).slice(0, 15).map((t, i) => {
        return `${i + 1}. ${t.symbol} ${t.side} P&L: $${t.pnl?.toFixed(2)} Hold: ${t.holdMinutes || "?"}m`;
    }).join("\n");
    return {
        system: `You are a trading coach providing daily tips. Based on the trader's recent data, generate exactly 5 coaching tips as a JSON array. Each tip must have:
- "type": one of "critical", "warning", "action", "success", "info"
- "title": short title (3-6 words)
- "message": one sentence of specific, actionable advice referencing their actual data

Use "critical" sparingly (only for serious issues like large losing streaks). Use "success" for things they're doing well. The rest should be "action" or "info" with concrete suggestions.

Return ONLY a valid JSON array. No markdown, no explanation. Example:
[{"type":"success","title":"Strong Win Rate","message":"Your 65% win rate is above the retail average — keep doing what you're doing on EUR/USD."}]`,
        user: `My stats: ${tradeCount} trades, ${winRate?.toFixed(1)}% win rate, avg P&L: $${avgPnl?.toFixed(2)}, total P&L: $${totalPnl?.toFixed(2)}, current losing streak: ${consecutiveLosses || 0}, best symbol: ${bestSymbol || "N/A"}, worst symbol: ${worstSymbol || "N/A"}, avg hold: ${avgHoldMinutes || "?"}m.\n\nRecent trades:\n${recentSummary}\n\nGive me 5 coaching tips.`,
        maxTokens: 500,
        temperature: 0.7,
    };
}
function buildPropTrackerPrompt(payload) {
    const { accounts, transactions } = payload;
    // Build per-account summaries
    const accountSummaries = accounts.map(a => {
        const txs = transactions.filter(t => t.propAccountId === a.id);
        const expenses = txs.filter(t => ["evaluation-fee", "reset-fee", "monthly-fee", "other-expense"].includes(t.type));
        const payouts = txs.filter(t => t.type === "payout");
        const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
        const totalPayouts = payouts.reduce((s, t) => s + t.amount, 0);
        const net = totalPayouts - totalExpenses;
        const daysActive = a.endDate
            ? Math.round((new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / 86400000)
            : Math.round((Date.now() - new Date(a.startDate).getTime()) / 86400000);
        const txDetail = txs.length > 0
            ? txs.map(t => `  - ${t.date}: ${t.type} $${t.amount}${t.description ? ` (${t.description})` : ""}`).join("\n")
            : "  - No transactions logged";
        return `${a.firmName} | $${a.accountSize.toLocaleString()} ${a.accountType} | Status: ${a.status} | ${daysActive} days active\n  Fees: $${totalExpenses} | Payouts: $${totalPayouts} | Net: ${net >= 0 ? "+" : ""}$${net}\n${txDetail}`;
    }).join("\n\n");
    const totalExpenses = transactions.filter(t => ["evaluation-fee", "reset-fee", "monthly-fee", "other-expense"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
    const totalPayouts = transactions.filter(t => t.type === "payout").reduce((s, t) => s + t.amount, 0);
    const netPnl = totalPayouts - totalExpenses;
    const roi = totalExpenses > 0 ? ((totalPayouts / totalExpenses - 1) * 100).toFixed(1) : "N/A";
    return {
        system: `You are a prop trading analyst. Analyze a trader's prop firm account data and give them an honest, plain-English assessment. Be direct and specific — reference their actual numbers. Structure your response with these sections:

**Overall Verdict** — one sentence on whether prop trading is working for them financially.
**ROI Breakdown** — fees paid vs payouts received, net P&L, and what the numbers actually mean.
**Firm-by-Firm** — which accounts are profitable, which are losing money, and why.
**Warning Signs** — any red flags (e.g. too many resets, high monthly fees eating profits, failed accounts).
**What to Do Next** — 2-3 specific, actionable recommendations based on the data.

Keep it under 400 words. Use $ amounts from their data. No generic advice.`,
        user: `Here is my prop firm tracker data:\n\nSummary: ${accounts.length} accounts | Total fees: $${totalExpenses} | Total payouts: $${totalPayouts} | Net P&L: ${netPnl >= 0 ? "+" : ""}$${netPnl} | ROI: ${roi}%\n\nAccounts:\n${accountSummaries}\n\nGive me an honest analysis.`,
        maxTokens: 600,
        temperature: 0.5,
    };
}
exports.aiAssist = functions.https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
    }
    const uid = context.auth.uid;
    // 2. Pro check
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isPro) {
        throw new functions.https.HttpsError("permission-denied", "This is a Pro feature.");
    }
    // 3. Route by type
    console.log("aiAssist data received:", JSON.stringify(data).slice(0, 500));
    const request = data;
    if (!request.type || !request.payload) {
        console.error("aiAssist invalid-argument: type=", request.type, "payload=", !!request.payload);
        throw new functions.https.HttpsError("invalid-argument", "Missing type or payload.");
    }
    const promptBuilders = {
        journal_prompts: buildJournalPromptsPrompt,
        trade_review: buildTradeReviewPrompt,
        risk_alert: buildRiskAlertPrompt,
        strategy_tagger: buildStrategyTaggerPrompt,
        goal_coach: buildGoalCoachPrompt,
        coaching_tips: buildCoachingTipsPrompt,
        prop_tracker: buildPropTrackerPrompt,
    };
    const builder = promptBuilders[request.type];
    if (!builder) {
        throw new functions.https.HttpsError("invalid-argument", `Unknown type: ${request.type}`);
    }
    // 4. Check rate limit for this specific feature
    const featureType = request.type;
    const usageRef = db.collection("users").doc(uid).collection("meta").doc("aiUsage");
    const usageDoc = await usageRef.get();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const usageData = usageDoc.exists ? usageDoc.data() : null;
    let usedToday = 0;
    if (usageData && usageData.date === todayStr && usageData[featureType]) {
        usedToday = usageData[featureType] || 0;
    }
    const limit = RATE_LIMITS[featureType];
    if (usedToday >= limit) {
        // Format feature name for display
        const featureNames = {
            ai_analysis: "AI Trade Analysis",
            goal_coach: "Goal Coach",
            trade_review: "Trade Review",
            prop_tracker: "PropTracker AI Analysis",
            coaching_tips: "Coaching Tips",
            journal_prompts: "Journal Prompts",
            risk_alert: "Risk Alert",
            strategy_tagger: "Strategy Tagger",
        };
        const displayName = featureNames[featureType] || featureType.replace(/_/g, " ");
        throw new functions.https.HttpsError("resource-exhausted", `Daily ${displayName} limit reached (${limit}/day). Resets at midnight UTC.`);
    }
    // Cooldown: Prevent rapid-fire requests (minimum 3 seconds between requests)
    if (usageData?.lastUsed) {
        const lastUsedTime = usageData.lastUsed?._seconds
            ? usageData.lastUsed._seconds * 1000
            : usageData.lastUsed;
        const now = Date.now();
        const timeSinceLastRequest = now - lastUsedTime;
        const COOLDOWN_MS = 3000; // 3 seconds
        if (timeSinceLastRequest < COOLDOWN_MS) {
            const waitTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
            throw new functions.https.HttpsError("resource-exhausted", `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before making another request.`);
        }
    }
    const prompt = builder(request.payload);
    // 5. Call OpenAI with appropriate model
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key-here") {
        throw new functions.https.HttpsError("internal", "OpenAI API key not configured.");
    }
    const openai = new openai_1.default({ apiKey });
    const model = FEATURE_MODELS[featureType];
    let result;
    try {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: "system", content: prompt.system },
                { role: "user", content: prompt.user },
            ],
            max_tokens: prompt.maxTokens,
            temperature: prompt.temperature,
        });
        result = completion.choices[0]?.message?.content || "No response generated.";
    }
    catch (err) {
        console.error("OpenAI API error:", err.message);
        throw new functions.https.HttpsError("internal", "AI request failed. Please try again.");
    }
    // 6. Update rate limit
    await usageRef.set({
        date: todayStr,
        [featureType]: usedToday + 1,
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
        result,
        usage: {
            used: usedToday + 1,
            limit,
            remaining: limit - (usedToday + 1),
        },
    };
});
// ─── Cloud Sync Proxy (bypasses content blockers) ──────────
const SYNC_KEYS = ['trades', 'journalEntries', 'goals', 'accounts', 'riskRules', 'onboardingCompleted', 'onboarding', 'propFirmAccounts', 'propFirmTransactions'];
/**
 * Syncs data to Firestore (bypasses content blockers)
 * Client calls this instead of direct Firestore SDK
 */
exports.syncData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = context.auth.uid;
    // Pro check — cloud sync is a Pro feature
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isPro) {
        throw new functions.https.HttpsError("permission-denied", "Cloud sync is a Pro feature.");
    }
    const { key, value } = data;
    if (!key || !SYNC_KEYS.includes(key)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid sync key.");
    }
    // Prevent DOS: Limit sync value size to 1MB
    const MAX_SYNC_SIZE = 1024 * 1024; // 1MB
    if (value && value.length > MAX_SYNC_SIZE) {
        throw new functions.https.HttpsError("invalid-argument", `Sync value too large. Max size: 1MB`);
    }
    // CRITICAL: Never sync empty arrays - prevents data loss
    const isEmpty = value === '[]' || value === '{}' || value === '' || value === 'null';
    if (isEmpty && (key === 'trades' || key === 'accounts' || key === 'journalEntries' || key === 'goals')) {
        console.warn(`[syncData] Blocked empty ${key} from syncing for ${uid}`);
        return { success: false, reason: 'empty_data_blocked' };
    }
    try {
        await db.collection('users').doc(uid).collection('sync').doc(key).set({
            data: value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[syncData] Synced ${key} for ${uid}`);
        return { success: true };
    }
    catch (err) {
        console.error(`[syncData] Error syncing ${key} for ${uid}:`, err.message);
        throw new functions.https.HttpsError("internal", "Failed to sync data.");
    }
});
/**
 * Gets all sync data from Firestore (bypasses content blockers)
 * Client calls this to restore data on new devices
 */
exports.getSyncData = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = context.auth.uid;
    // Pro check — cloud sync is a Pro feature
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isPro) {
        throw new functions.https.HttpsError("permission-denied", "Cloud sync is a Pro feature.");
    }
    try {
        const syncData = {};
        for (const key of SYNC_KEYS) {
            const doc = await db.collection('users').doc(uid).collection('sync').doc(key).get();
            if (doc.exists) {
                const data = doc.data();
                if (data?.data) {
                    syncData[key] = data.data;
                }
            }
        }
        console.log(`[getSyncData] Retrieved ${Object.keys(syncData).length} keys for ${uid}`);
        return { data: syncData };
    }
    catch (err) {
        console.error(`[getSyncData] Error for ${uid}:`, err.message);
        throw new functions.https.HttpsError("internal", "Failed to get sync data.");
    }
});
//# sourceMappingURL=index.js.map