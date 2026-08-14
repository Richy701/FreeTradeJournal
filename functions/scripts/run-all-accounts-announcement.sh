#!/bin/bash
# Fired by launchd (com.freetradejournal.all-accounts-announcement) on Mon 17
# Aug 2026, 14:00 BST / 13:00 UTC — same peak live-audience hour as the 12 Aug
# campaign. The dedup field makes accidental re-runs harmless (0 sends), but
# the plist is removed afterwards anyway so the job can't fire again.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/all-accounts-announcement-send.log
PLIST=/Users/richy/Library/LaunchAgents/com.freetradejournal.all-accounts-announcement.plist

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== all-accounts announcement live send started $(date -u) ==="
  DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-all-accounts-announcement.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1

rm -f "$PLIST"
