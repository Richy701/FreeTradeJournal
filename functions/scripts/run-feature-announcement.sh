#!/bin/bash
# Fired by launchd (com.freetradejournal.feature-announcement) on Wed 12 Aug
# 2026, 14:00 BST / 13:00 UTC — the daily peak live-audience hour.
# The dedup field makes accidental re-runs harmless (0 sends), but the plist
# is removed afterwards anyway so the job can't fire again next year.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/feature-announcement-send.log
PLIST=/Users/richy/Library/LaunchAgents/com.freetradejournal.feature-announcement.plist

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== feature announcement live send started $(date -u) ==="
  DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-feature-announcement.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1

rm -f "$PLIST"
