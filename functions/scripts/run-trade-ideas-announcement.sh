#!/bin/bash
# Fired by launchd (com.freetradejournal.trade-ideas-announcement) on
# Wed 26 Aug 2026, 14:00 BST / 13:00 UTC. The dedup field
# (tradeIdeasAnnouncementSentAt) makes accidental re-runs harmless (0 sends),
# but the plist is removed afterwards anyway so the job can't fire again.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/trade-ideas-announcement-send.log
PLIST=/Users/richy/Library/LaunchAgents/com.freetradejournal.trade-ideas-announcement.plist

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== trade ideas announcement live send started $(date -u) ==="
  DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-trade-ideas-announcement.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1

rm -f "$PLIST"
