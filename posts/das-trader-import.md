---
title: How to Import DAS Trader Exports Into a Trading Journal (Free)
subtitle: DAS gives you one row per execution. Here's how to turn that into real round-trip trades without a spreadsheet.
tags: das trader, das trader pro, trading journal, day trading, import trades, stock trading
date: 2026-07-27
coverImage: https://www.freetradejournal.com/images/screenshots/trading-log-screenshot.png
---

If you trade through DAS Trader Pro (or the simulator), you've probably hit this wall: the Trades window exports one row per execution, not one row per trade. Buy 300 shares in three fills, sell in two, and your "one trade" is five rows of raw executions with no entry price, no exit price, and no P&L per position.

Most journals choke on that. You either hand-build a spreadsheet that pairs your fills, or you give up on journaling the details and just track your daily total. Neither one helps you improve.

FreeTradeJournal now imports DAS exports directly. Here's how it works and what it handles.

## Exporting from DAS

In DAS Trader Pro, open your Trades window, right-click, and export to CSV. That's it — no plugins, no special settings. The simulator exports the same format, so you can journal your sim sessions exactly like live ones.

One quirk worth knowing: DAS daily exports sometimes carry only a clock time on each row, with the date nowhere in the file. If your file is named something like `July20.csv`, the importer reads the trading date from the file name. Keep the default file names DAS gives you and it just works.

## What the importer actually does

When you drop the file into FreeTradeJournal (Dashboard or Trade Log, both work), the importer:

- **Pairs your executions into round trips.** Buys and sells are matched into complete positions, so five fills become one trade with a real entry price, exit price, and share count.
- **Handles short selling.** Sell-to-open followed by buy-to-cover comes out as a short trade with the direction and P&L the right way around.
- **Handles partial exits.** Scale out of a position in pieces and the importer closes the trade where your position actually flattens.
- **Handles position flips.** If you go from long 200 to short 100 in one order, that's two trades — the importer splits them instead of producing garbage.

After a bigger import, the AI reads your trades and gives you a first-pass summary of what it sees — your win rate, where your losses cluster, what session you trade best. It's a fast way to sanity-check that everything landed correctly, and usually tells you something you didn't know about your own trading.

## Why bother journaling executions properly

Daily P&L tells you whether you made money. Round-trip trades tell you *why*. Once your DAS fills are real trades in a journal, you can see your win rate by time of day, your average loser versus average winner, which tickers you should stop touching, and whether your scale-outs are saving you money or costing you.

That's the stuff that changes your next month. A number at the bottom of a spreadsheet doesn't.

## The cost

Importing is free. Not free for 14 days — the importer, the trade log, and the analytics are free, full stop. That's the whole point of the product.

If you trade DAS, [try the import](https://www.freetradejournal.com/signup) and see your executions turned into actual trades. It takes about a minute.
