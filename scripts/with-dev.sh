#!/usr/bin/env bash
# usage: bash scripts/with-dev.sh <command...>
set -euo pipefail
LOG="${TMPDIR:-/tmp}/skynav-dev.log"
npm run dev > "$LOG" 2>&1 &
PID=$!
cleanup() { pkill -P "$PID" 2>/dev/null || true; kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 90); do
  curl -sf http://localhost:3000/api/health >/dev/null && break
  sleep 1
  if [ "$i" = 90 ]; then echo "dev server did not start"; tail -n 30 "$LOG"; exit 1; fi
done
"$@"
