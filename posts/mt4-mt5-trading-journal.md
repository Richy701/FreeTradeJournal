---
title: How to Journal MT4 and MT5 Trades for Free (No Plugins Needed)
subtitle: Export your position history, drop it in, done. Works with IC Markets, Pepperstone, and most MT brokers.
tags: mt4, mt5, metatrader, forex trading journal, forex, import trades, trading journal
date: 2026-07-27
coverImage: https://www.freetradejournal.com/images/screenshots/dashboard-trades-performance-screenshot.png
---

Every forex trader I talk to journals the same way: they don't. The trades are "in MetaTrader somewhere," the account history tab technically counts as a record, and the actual review — the part that makes you better — never happens.

The usual excuse is friction. MetaTrader doesn't make your history easy to work with, and most journals that import MT4/MT5 data want you to install an EA, run a plugin, or pay for the privilege.

You don't need any of that to start. Here's the no-plugin way.

## Export your history from MetaTrader

**MT5:** open the Toolbox, go to the History tab, right-click, choose Positions, then right-click again and export. You get a position-history file — one row per closed position, which is exactly what a journal wants.

**MT4:** Account History tab, right-click, Save as Report or export the history. 

Broker portals work too — IC Markets, Pepperstone, and most MT brokers let you download your trade history as CSV from their client area.

## Drop it into FreeTradeJournal

The importer was built for the mess that MT exports actually are:

- **The preamble is handled.** MT5 files bury the real header under rows of account info. The importer finds it.
- **European formats are handled.** Dates like `2025.08.28` or `28.08.2025`, semicolon-separated files, comma decimals — all recognized automatically. A loss written as `−123,45` imports as a loss, not a gain.
- **Commissions and swap are captured separately** and subtracted, so the P&L you journal is the money that actually hit your account — net, not gross. Most traders who journal gross numbers are lying to themselves by exactly the amount of their costs.
- **Forex precision is kept.** Your EURUSD entry shows as 1.08523, not rounded to two decimals. JPY pairs keep their three.

If a file has a column layout the importer doesn't recognize on sight, a mapping dialog lets you match columns manually once, and you're through.

## What you get on the other side

Once your positions are in, the free analytics do the work MetaTrader never will: win rate by pair, by session, by day of week. Average winner against average loser. A calendar heatmap of your P&L. Risk rules that warn you when today's losses cross the line you set for yourself.

Journal a note and how you felt on each trade, and over time you can see whether your "I knew better" trades are a rounding error or half your losses. For most people it's not a rounding error.

## What about automatic sync?

It's coming — direct MetaTrader sync is being built right now, and manual CSV import will stay free either way. But don't wait for automation to start reviewing your trades. The export-and-drop routine takes two minutes a week, and two minutes a week is infinitely more journaling than most forex traders do.

[Start with your last month of trades](https://www.freetradejournal.com/signup) — export, drop, and look at your win rate by session. That first look is usually uncomfortable, and usually worth it.
