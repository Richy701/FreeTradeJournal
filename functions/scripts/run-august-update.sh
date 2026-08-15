#!/bin/bash
# Fired by launchd (com.freetradejournal.august-update) on Mon 17 Aug 2026,
# 14:00 BST / 13:00 UTC — the peak live-audience hour. Replaces the narrower
# all-accounts-only send that was armed for this slot. The dedup field makes
# accidental re-runs harmless (0 sends), but the plist is removed afterwards
# anyway so the job can't fire again.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/august-update-send.log
PLIST=/Users/richy/Library/LaunchAgents/com.freetradejournal.august-update.plist

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== august update live send started $(date -u) ==="
  DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-august-update.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1

rm -f "$PLIST"
