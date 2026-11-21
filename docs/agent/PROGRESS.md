# PROGRESS

Status values: `TODO` · `IN_PROGRESS` · `DONE` · `BLOCKED (reason)`.
Pick the first `TODO` whose dependencies are all `DONE`. A task without listed dependencies depends on the task above it.

| ID | Task | Deps | Status |
|---|---|---|---|
| W1-T01 | Scaffold Nuxt app, modules, Vitest, lint, folders | – | DONE |
| W1-T02 | Docker Postgres, Prisma schema, migration, health API, with-dev.sh | T01 | DONE |
| W1-T03 | Seed data | T02, T04 | TODO |
| W1-T04 | Shared units, geo, random, types | T01 | DONE |
| W1-T05 | Flight model, wind, loop helper | T04 | TODO |
| W1-T06 | Sim store, useSimLoop, useKeyboard | T05 | TODO |
| W1-T07 | Airports/stations API, cockpit page, MapView | T03, T06 | TODO |
| W1-T08 | Gauge helpers + 5 basic instruments | T06 | TODO |
| W1-T09 | Range, VOR, DME receivers | T04 | TODO |
| W1-T10 | NavRadio, CDI, wire receivers into the loop | T07, T08, T09 | TODO |
| W1-CHK | Week 1 checkpoint | T01–T10 | TODO |
| W2-T11 | Auth API, guards, extend smoke | W1-CHK | TODO |
| W2-T12 | Login/register pages, route middleware, navbar | T11 | TODO |
| W2-T13 | Scenarios + flights API (start/end/list) with integration tests | T11 | TODO |
| W2-T14 | Scenarios page, cockpit loads scenario, flight start/end, objectives, flight log | T12, T13 | TODO |
| W2-T15 | ADF receiver, AdfRadio, RMI | W1-CHK | TODO |
| W2-T16 | DVOR visual, range flags, wind from scenario | T14, T15 | TODO |
| W2-CHK | Week 2 checkpoint | T11–T16 | TODO |
| W3-T17 | ILS, markers, radio altimeter logic | W2-CHK | TODO |
| W3-T18 | HSI, marker lights, RA readout, audio callouts | T17 | TODO |
| W3-T19 | ProfileView | T17 | TODO |
| W3-T20 | Touchdown judge + flight end on landing/crash | T17 | TODO |
| W3-T21 | Recorder, samples API, scoring service | T20 | TODO |
| W3-T22 | Replay page | T21 | TODO |
| W3-CHK | Week 3 checkpoint | T17–T22 | TODO |
| W4-T23 | PFD | W3-CHK | TODO |
| W4-T24 | ND | T23 | TODO |
| W4-T25 | Alerts logic, EICAS, Master Caution/Warning | W3-CHK | TODO |
| W4-T26 | Autopilot logic (closed-loop tests) | W3-CHK | TODO |
| W4-T27 | MCP panel, AP wiring, classic/glass toggle | T23–T26 | TODO |
| W4-CHK | Week 4 checkpoint | T23–T27 | TODO |
| W5-T28 | INS model | W4-CHK | TODO |
| W5-T29 | GPS + blend | T28 | TODO |
| W5-T30 | Waypoints API, FMS logic, CDU, LNAV | W4-CHK | TODO |
| W5-T31 | INS/GPS on map, nav source selector | T29, T30 | TODO |
| W5-CHK | Week 5 checkpoint | T28–T31 | TODO |
| W6-T32 | Transponder + TCAS | W5-CHK | TODO |
| W6-T33 | GPWS + failure injection | W5-CHK | TODO |
| W6-T34 | Admin stations page + API | W5-CHK | TODO |
| W6-T35 | Dockerfile, compose app service, README | T32–T34 | TODO |
| W6-CHK | Final regression + demo checklist | all | TODO |

---

## Handoff log
Newest at the top. At most 5 lines per task.

### W1-T02 · DONE · 2026-11-21
- docker-compose db (postgres 17) + skynav_test via initdb; prisma 6 schema per §12; /api/health.
- Docker needs sudo on this machine (user not in docker group).
- Deviation: int globalSetup uses 'prisma migrate deploy' + resetDb() (Prisma blocks migrate reset for AI agents).
- Deviation: Prisma blocks/enums written multi-line (one-line form is invalid); CONTRACTS §12 fixed.

<!-- template
### W1-T04 · DONE · 2026-11-18
- Created: shared/utils/{units,geo,random}.ts, shared/types/index.ts, tests/unit/geo.test.ts
- Note: ...
- Deviation from CONTRACTS: none
-->

### W1-T04 · DONE · 2026-11-21
- Created shared/utils/{units,geo,random}.ts, shared/types/index.ts, tests/unit/geo.test.ts.
- Deviation: added `Intruder` and `ScenarioConfig` types (ScenarioDTO = ScenarioConfig + id/title/description/week).

### W1-T01 · DONE · 2026-11-21
- Nuxt 4.6, Pinia, Tailwind (@nuxtjs/tailwindcss), nuxt-auth-utils, @nuxt/eslint, Vitest 5, zod 4, bcryptjs.
- Deviation: nuxt-auth-utils 0.6 uses NUXT_APP_SECRET (not NUXT_SESSION_PASSWORD); docs updated.
