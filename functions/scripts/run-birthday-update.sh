#!/bin/bash
# Fired by launchd (com.freetradejournal.birthday-update) on
# Thu 28 Aug 2026, 14:00 BST / 13:00 UTC, 13 hours after the lifetime card
# and checkout window opened (00:00 UTC). The dedup field
# (birthdayUpdateSentAt) makes accidental re-runs harmless (0 sends), but the
# plist is removed afterwards anyway so the job can't fire again.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/birthday-update-send.log
PLIST=/Users/richy/Library/LaunchAgents/com.freetradejournal.birthday-update.plist

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== birthday lifetime live send started $(date -u) ==="
  DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-birthday-update.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1

rm -f "$PLIST"
