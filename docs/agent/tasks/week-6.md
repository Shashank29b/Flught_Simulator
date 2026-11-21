# Week 6: Surveillance, failures, admin, release

Week goal: transponder, TCAS and GPWS; failure scenarios; an admin page; and one-command Docker deployment with a final regression.

Read only your own card: `sed -n '/^### W6-T3X/,/^### W/p' docs/agent/tasks/week-6.md`

---

### W6-T32 · Transponder + TCAS
**Goal:** scripted traffic produces TA and RA alerts shown on the ND.
**Contracts:** §9 (tcas, moveIntruder, transponder), §2 (ScenarioDTO.traffic).
**Read:** `app/sim/engine.ts`, `app/components/instruments/ND.vue` (props only).
**Create:** `app/systems/tcas.ts`, `app/systems/transponder.ts`, `tests/unit/tcas.test.ts`, `tests/unit/transponder.test.ts`, `app/components/radios/Transponder.vue`. **Modify:** `app/sim/engine.ts` (move the traffic; `world.tcas`; `tcasRA` into the alerts), `ND.vue` (traffic symbols), `app/composables/useAudio.ts` ("TRAFFIC, TRAFFIC" and "CLIMB, CLIMB" / "DESCEND, DESCEND", once per new level), `app/pages/fly/[id].vue`.

**Steps**
- **Transponder:** a 4-digit entry with only digits 0–7 accepted, modes STBY/ALT, an IDENT button lit for 18 s, and the Mode C altitude shown.
- **ND traffic symbols:**
  - other: a hollow white diamond
  - PROXIMATE: a filled white diamond
  - TA: an amber circle
  - RA: a red square
  - each with its relative altitude in hundreds of feet and a ↑/↓ arrow

**Tests:** TC1–TC5, XP1–XP2.
**Verify:** `npm run check`.
**Commit:** `feat(systems): transponder and tcas with nd traffic display`

---

### W6-T33 · GPWS + failure injection
**Goal:** GPWS warnings, plus the scenario failures (VOR, GPS, ENGINE) at their set times.
**Contracts:** §9 (gpws), §2 (ScenarioDTO.failures), §4 (the failure line).
**Read:** `app/sim/engine.ts`, `app/systems/alerts.ts` (exports only).
**Create:** `app/systems/gpws.ts`, `app/sim/failures.ts` (`activeFailures(list, simMs) → Set<FailureType>`), `tests/unit/gpws.test.ts`, `tests/unit/failures.test.ts`. **Modify:** `app/sim/engine.ts` (VOR → vor1/dme1 invalid; GPS → outage; ENGINE → throttle 0; gpws into alerts; NAV FAIL caution), `app/composables/useAudio.ts` ("PULL UP", "SINK RATE", "TOO LOW, GEAR"), `FlightBanner.vue` (a failure banner).
**Tests:** GP1–GP4. Failures: an item at 60 s is active at 60.0 s and not at 59.9 s. E11: GPS failure → the blended position stops correcting.
**Verify:** `npm run check`.
**Commit:** `feat(systems): gpws and scenario failure injection`

---

### W6-T34 · Admin stations page + API
**Goal:** admins can add, edit and delete nav stations; students get 403.
**Contracts:** §13 (stations admin rows), §12 (NavStation).
**Read:** `server/utils/auth.ts`, `server/services/navdata.ts` (exports only), `scripts/smoke.mjs` (tail).
**Create:** `server/validators/stations.ts`, `server/api/stations/index.post.ts`, `server/api/stations/[id].put.ts`, `server/api/stations/[id].delete.ts`, `tests/int/stations.test.ts`, `app/pages/admin/stations.vue`. **Modify:** `server/services/navdata.ts` (create, update, delete), `scripts/smoke.mjs`.

**Steps**
- The page uses `middleware: ['auth', 'admin']`. It shows a table of stations and a form that accepts local x/y in NM (converted with `toLatLon`) or lat/lon directly. The frequency range is validated by type (VOR/DME/ILS 108–117.95, NDB 190–1750).
- Smoke: a student POST returns 403; an admin POST returns 201, then DELETE succeeds (log in as the seeded admin).

**Tests (int):** create/update/delete; an invalid frequency → 400.
**Verify:** `npm run check`, `npm run test:int`, smoke.
**Commit:** `feat(admin): station management api and page`

---

### W6-T35 · Docker deploy + README
**Goal:** `docker compose up --build` runs the whole app from a clean clone.
**Deps:** T32–T34. **Contracts:** none.
**Read:** `docker-compose.yml`, `package.json` (scripts only).
**Create:** `Dockerfile`, `.dockerignore`, `README.md`. **Modify:** `docker-compose.yml` (add the `app` service).

**Steps**
1. `Dockerfile`: `node:22-slim`; `apt-get install -y openssl`; `npm ci`; `npx prisma generate`; `npm run build`. Command: `sh -c "npx prisma migrate deploy && node .output/server/index.mjs"`. Keep the dev deps so that `npx prisma db seed` works inside the container.
2. `.dockerignore`: `node_modules`, `.nuxt`, `.output`, `.env`, `.git`.
3. Compose `app` service: build `.`, port 3000, `DATABASE_URL` pointing at host `db`, `NUXT_APP_SECRET` from env, and `depends_on: db: condition: service_healthy`.
4. README: what the project is, its features by week, the tech stack, quick start (dev and Docker), seeding (`docker compose run --rm app npx prisma db seed`), the test commands, the demo accounts, the keyboard controls and the folder map. Add placeholders for screenshots.

**Verify**
`docker compose up -d --build 2>&1 | tail -n 10`, then `docker compose run --rm app npx prisma db seed`, then `BASE_URL=http://localhost:3000 npm run smoke`, then `docker compose down`.
**Commit:** `chore(deploy): dockerfile, compose app service, readme`

---

### W6-CHK · Final regression + demo
1. A full run: `npm run check`, `npm run test:int`, the smoke run via with-dev, and the Docker smoke from T35.
2. `grep -rn "TODO\|FIXME" app server shared | head -n 20`: resolve these or list them in the handoff.
3. Check that no source file is over 300 lines: `find app server shared -name '*.ts' -o -name '*.vue' | xargs wc -l | sort -n | tail -n 5`.
4. Write the **demo script** into the handoff for the human:
   1. VOR to VOR by hand (VOR/DME/RMI)
   2. NDB homing in wind
   3. A hand-flown ILS landing, then the score and replay
   4. A glass cockpit coupled approach
   5. INS drift and the GPS blend; the FMS route in LNAV
   6. The TCAS encounter
   7. The GPS + VOR failure
   8. Admin editing a station
5. `git tag v1.0`.

**Commit:** `chore: final regression and v1.0`
