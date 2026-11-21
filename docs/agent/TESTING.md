# TESTING

## Layers
| Layer | Folder | Tool | Command | Runs against |
|---|---|---|---|---|
| Unit | `tests/unit/*.test.ts` | Vitest (plain, node env) | `npm run test:unit` | Pure functions only |
| Integration | `tests/int/*.test.ts` | Vitest + Prisma | `npm run test:int` | Test DB `skynav_test` |
| API smoke | `scripts/smoke.mjs` | Node `fetch` | `bash scripts/with-dev.sh npm run smoke` | Running dev server |
| Page check | (inside smoke) | `fetch` → status 200 | same | Running dev server |
| Visual | checklist below | Human | – | Browser |

`npm run check` = `nuxi typecheck && eslint . && vitest run --reporter=dot` (unit only). It must pass at the end of every task.

## Config (created in W1-T01 / W1-T02)
- `vitest.config.ts`: `include: ['tests/unit/**/*.test.ts']`, `environment: 'node'`.
  Aliases: `~~` → project root, `#shared` → `./shared`. Unit-tested code uses relative imports anyway.
- `vitest.int.config.ts`: `include: ['tests/int/**/*.test.ts']`, `fileParallelism: false`,
  `globalSetup: 'tests/int/globalSetup.ts'`, which runs
  `DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy` (non-destructive; Prisma blocks `migrate reset` from AI agents). Each test file calls `resetDb()` (TRUNCATE) in `beforeEach`.
- `tests/int/helpers.ts`: exports a `prisma` client built on `TEST_DATABASE_URL`, plus `resetDb()`, which truncates every table.
- `.env`: `DATABASE_URL`, `TEST_DATABASE_URL`, `NUXT_APP_SECRET`.
- `docker/initdb/01-test-db.sql`: `CREATE DATABASE skynav_test;` (mounted into the Postgres container).

## Scripts
`scripts/with-dev.sh` (W1-T02):
```bash
#!/usr/bin/env bash
# usage: bash scripts/with-dev.sh <command...>
set -euo pipefail
npm run dev > /tmp/skynav-dev.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
for i in $(seq 1 60); do
  curl -sf http://localhost:3000/api/health >/dev/null && break
  sleep 1
  if [ "$i" = 60 ]; then echo "dev server did not start"; tail -n 30 /tmp/skynav-dev.log; exit 1; fi
done
"$@"
```

`scripts/smoke.mjs` (created in W1-T02, then extended each week). It is a sequence of `check(name, fn)` steps that prints `PASS` or `FAIL` per line and exits 1 on any failure. It keeps the session cookie between requests. Every task that adds an endpoint **appends** steps to it:
| Added in | Steps |
|---|---|
| W1-T02 | health → db true |
| W1-T07 | GET /api/airports has XTRN; GET /api/stations has ≥ 10 |
| W2-T11 | register a random user → login → me → logout → me 401 |
| W2-T13 | scenarios ≥ 9; scenario 1 has config; start flight → end ABORTED → score 0 |
| W3-T21 | start flight → post 25 samples → end LANDED with landing → score > 0 → GET flight has 25 samples |
| W5-T30 | GET /api/waypoints = 3 |
| W6-T34 | student POST /api/stations → 403; admin → 201 → DELETE |
| every week | pages `/`, `/login`, `/scenarios`, `/fly/1`, `/flights` return 200 |

## Week checkpoints (agent runs these, then the human does the visual list)
Agent:
```bash
npm run check 2>&1 | tail -n 20
npm run test:int -- --reporter=dot 2>&1 | tail -n 20
bash scripts/with-dev.sh npm run smoke 2>&1 | tail -n 30
```

Human visual checklist:
- **Week 1:** Open /fly/1. The aircraft takes off with W and the arrow keys, and the map shows the trail. All 5 gauges move correctly. Tune 113.50; the CDI centres on the selected radial; TO/FROM flips when passing the station; the DME counts down.
- **Week 2:** Register and log in. The scenarios list shows. Flying "NDB homing", the ADF needle points to the NDB and the RMI shows both needles. Wind makes the aircraft drift. The flight appears in /flights.
- **Week 3:** "ILS approach 09": the HSI LOC and GS bars move correctly, the OM/MM/IM lights blink in sequence, and the callouts play. Landing gives a score, and the replay shows the track and graphs.
- **Week 4:** The PFD and ND are readable. The autopilot HDG/ALT work, and APP flies the coupled ILS down to about 200 ft. The STALL and GEAR warnings show.
- **Week 5:** The INS position (orange) drifts away from the true one; with GPS on, the blended position (green) stays close. The FMS route is flown in LNAV.
- **Week 6:** The TCAS intruder shows TA then RA, with an RA message. The GPS and VOR failures trigger flags. The admin page edits a station. `docker compose up --build` works from a clean clone.
