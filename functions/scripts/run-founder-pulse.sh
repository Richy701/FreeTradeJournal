#!/bin/bash
# Fired by launchd (com.freetradejournal.founder-pulse) every Monday 08:00
# local time. Sends the private founder stats email to Richy ONLY — this is
# not a user-facing campaign. If the Mac was asleep at 08:00, launchd runs it
# on wake; if it was fully powered off, run this script by hand.
export PATH="/usr/local/bin:/usr/bin:/bin"
LOG=/Users/richy/FreeTradeJournal/functions/scripts/founder-pulse.log

cd /Users/richy/FreeTradeJournal/functions || exit 1
{
  echo "=== founder pulse started $(date -u) ==="
  npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-founder-pulse.ts
  echo "=== finished $(date -u) exit=$? ==="
} >> "$LOG" 2>&1
