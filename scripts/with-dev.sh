#!/usr/bin/env bash
# usage: bash scripts/with-dev.sh <command...>
set -euo pipefail
LOG="${TMPDIR:-/tmp}/skynav-dev.log"
if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then echo "port 3000 already in use; stop the other server first"; exit 1; fi
setsid npm run dev > "$LOG" 2>&1 &
PID=$!
cleanup() { kill -- -"$PID" 2>/dev/null || true; sleep 1; pkill -f "^node .*/nuxt dev" 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 90); do
  curl -sf http://localhost:3000/api/health >/dev/null && break
  sleep 1
  if [ "$i" = 90 ]; then echo "dev server did not start"; tail -n 30 "$LOG"; exit 1; fi
done
# warm up pages (first SSR request can trigger a dependency re-optimise restart)
for p in / /login /fly/1; do
  for i in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$p" || true)
    [ "$code" = 200 ] && break
    sleep 1
  done
done
"$@"
