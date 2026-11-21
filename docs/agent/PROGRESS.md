# PROGRESS

Status values: `TODO` · `IN_PROGRESS` · `DONE` · `BLOCKED (reason)`.
Pick the first `TODO` whose dependencies are all `DONE`. A task without listed dependencies depends on the task above it.

| ID | Task | Deps | Status |
|---|---|---|---|
| W1-T01 | Scaffold Nuxt app, modules, Vitest, lint, folders | – | DONE |
| W1-T02 | Docker Postgres, Prisma schema, migration, health API, with-dev.sh | T01 | DONE |
| W1-T03 | Seed data | T02, T04 | DONE |
| W1-T04 | Shared units, geo, random, types | T01 | DONE |
| W1-T05 | Flight model, wind, loop helper | T04 | DONE |
| W1-T06 | Sim store, useSimLoop, useKeyboard | T05 | DONE |
| W1-T07 | Airports/stations API, cockpit page, MapView | T03, T06 | DONE |
| W1-T08 | Gauge helpers + 5 basic instruments | T06 | DONE |
| W1-T09 | Range, VOR, DME receivers | T04 | DONE |
| W1-T10 | NavRadio, CDI, wire receivers into the loop | T07, T08, T09 | DONE |
| W1-CHK | Week 1 checkpoint | T01–T10 | DONE |
| W2-T11 | Auth API, guards, extend smoke | W1-CHK | DONE |
| W2-T12 | Login/register pages, route middleware, navbar | T11 | DONE |
| W2-T13 | Scenarios + flights API (start/end/list) with integration tests | T11 | DONE |
| W2-T14 | Scenarios page, cockpit loads scenario, flight start/end, objectives, flight log | T12, T13 | DONE |
| W2-T15 | ADF receiver, AdfRadio, RMI | W1-CHK | DONE |
| W2-T16 | DVOR visual, range flags, wind from scenario | T14, T15 | DONE |
| W2-CHK | Week 2 checkpoint | T11–T16 | DONE |
| W3-T17 | ILS, markers, radio altimeter logic | W2-CHK | DONE |
| W3-T18 | HSI, marker lights, RA readout, audio callouts | T17 | DONE |
| *(remaining tasks: see Plan v2 below)* | | | |

**Plan v2 (2026-11-21): remaining work in priority order.** See `docs/PLAN.md`. The task cards in `tasks/week-N.md` still apply; only the order changed. Work P1 → P5 first, then the Optional block.

| Priority | ID | Task | Deps | Status |
|---|---|---|---|---|
| P1 | W3-T20 | Touchdown judge + flight end on landing/crash | T17 | DONE |
| P1 | W3-T21 | Browser flight recorder (5 Hz, batched) → server scoring (server side already done) | T20 | DONE |
| P1 | W3-T22 | Replay page (track, altitude/LOC/GS graphs, score) | T21 | DONE |
| P1 | P1-CHK | Checkpoint: ILS landing → score → replay works (lab minimum) | P1 | DONE |
| P2 | W4-T26 | Autopilot modes HDG/ALT/VS/NAV/APP (closed-loop tests; reuse autoflight inner loops) | P1-CHK | DONE |
| P2 | W4-T27 | MCP panel + AP wiring (classic/glass toggle after P3) | T26 | DONE |
| P3 | W4-T23 | PFD | P2 | DONE |
| P3 | W4-T24 | ND | T23 | DONE |
| P3 | P3-CHK | Checkpoint: coupled ILS on the glass cockpit | P2, P3 | DONE |
| P4 | W5-T28 | INS model (drift) | P3-CHK | TODO |
| P4 | W5-T29 | GPS + INS/GPS blend | T28 | TODO |
| P4 | W5-T31 | INS/GPS/blended positions on the map, nav source selector | T29 | TODO |
| P5 | W6-T35 | Dockerfile + compose app service (one-command run) | – | TODO |
| P5 | FINAL | Final regression, demo script, tag v1.0 | P1–P5 | TODO |
| Optional | W3-T19 | Approach profile (side) view | T17 | TODO |
| Optional | W4-T25 | Alerts, EICAS, Master Caution/Warning | – | TODO |
| Optional | W5-T30 | FMS route + CDU + LNAV (waypoints API done) | – | TODO |
| Optional | W6-T32 | Transponder + TCAS | – | TODO |
| Optional | W6-T33 | GPWS + failure injection | – | TODO |
| Optional | W6-T34 | Admin stations page + API | – | TODO |

---

## Handoff log
Newest at the top. At most 5 lines per task.

### W4-T24 · DONE · 2026-11-21
- ND.vue + ndProject.ts: heading-up arc, range 10–160 NM, airports, runways, VOR/NDB, tuned VOR course (magenta), journey destination, trail, GS/TAS/wind.
- Classic/Glass toggle in CockpitPanel (remembered); triple-tap cards for PFD and ND.

### W4-T23 · DONE · 2026-11-21
- PFD.vue + pfdDraw.ts (attitude, speed tape with stall band + A/THR bug, baro altitude tape + ALT bug, VSI, heading tape + HDG bug, ILS diamonds, RA, FMA).
- Note: contract said tapeTicks(3450,100,400) = 3000…3900; correct range is 3100…3800 (test uses that).

### W4-T27 · DONE · 2026-11-21
- MCP.vue: CRS/HDG/SPD/ALT/V-S windows, AP, A/THR, HDG/NAV/APP/ALT/V-S buttons (green active, cyan armed), FMA strip; store.setAp; manual stick input disconnects.
- e2e: coupled ILS from the 8 NM final captures LOC + G/S and descends.
- Classic/glass toggle comes with P3.

### W4-T26 · DONE · 2026-11-21
- app/systems/autopilot.ts apStep/apFromAircraft/fma; engine runs it when world.ap.engaged (journey autopilot takes precedence).
- Tests AP1–AP4 + VS level-off, VOR NAV capture, A/THR, FMA (trainer, 120 kt).

### W3-T22 · DONE · 2026-11-21
- pages/flights/[id].vue + TrackPlot.vue (track coloured by altitude over the VOBL runways, scrubber) + LineChart.vue (altitude, LOC, GS, IAS).
- tests/e2e/testmode.mjs: login → ILS scenario → short final → LANDED 100/100 → replay; npm run test:e2e runs both browser suites.

### W3-T21 · DONE · 2026-11-21
- app/composables/useRecorder.ts: 5 Hz sim-time samples in the fixed VOBL frame, batches of 25, flushed via session.beforeEnd before PATCH end.
- Smoke: start → 25 samples → LANDED → score > 0 → GET has 25 samples.

### W3-T20 · DONE · 2026-11-21
- app/sim/landing.ts judgeTouchdown(pre, ac, runways) picks the runway touched (or nearest); engine sets world.lastTouchdown on every touchdown and ends Test-mode flights (LAND objective, or any crash).
- Cockpit status line shows the last touchdown (result, runway, fpm, metres off centre).

### W3-T18 · DONE · 2026-11-21
- HSI.vue + hsiMath.ts (auto VOR/LOC mode: LOC when NAV 1 is on a localiser frequency, course = runway heading), MarkerRaPanel.vue (O/M/I lamps, RA, callout text), useAudio (marker tones + spoken callouts; off until enabled).
- Cockpit instruments grid is now 5 × 2; triple-tap cards for HSI and markers/RA. ILS preset sits on the 09L centreline (hdg 090.5).
- e2e: ILS final preset check (11 browser checks).

### W3-T17 · DONE · 2026-11-21
- app/nav/{ils,markers,radioAlt}.ts; engine sets nav.ils/markers/raFt using the ground elevation.
- Deviation: ilsReceive(stations, runways, navMHz, ac, elevFt) takes the runway list (LOC→runwayId) instead of one runway; nearest LOC on the frequency wins.
- Tests I1–I4, S1–S3, M1–M2, RA1, CO1–CO2, E6/E6b.

### FINAL CHECK · DONE · 2026-11-21
- All green: check (93 unit), int (9), smoke, e2e (10 browser checks), production build (no warnings).
- Fixed: presets during a journey kept the autopilot; time acceleration leaked into new flights; same-airport or short-runway journeys are now blocked with a message; duplicate Atmosphere type; Tailwind nesting warning.
- Added: aircraft speed ±10 kt (journey: cruise speed override) and sim-speed ± in the control panel; SETUP.md; README rewritten.
- Remaining from the original plan: ILS needles/HSI, landing judge + replay page, PFD/ND/EICAS, INS/GPS, TCAS/GPWS, admin page, Dockerfile.

### JOURNEY + JET + KEYS + INDIA FILTER (extra, user requests) · DONE · 2026-11-21
- Journey mode (Cockpit → "Journey (autopilot)"): pick From/To airports + runways (search API), cruise altitude; app/sim/autoflight.ts flies take-off → climb → cruise → descent → approach → 3° final → flare → rollout → arrived; time ×1–64; disengage on manual input; tests JY1/JY2 (lands < 30 m from the centreline).
- Aircraft profiles (app/sim/aircraft.ts): Jet (350 kt, rotate 145, cruise 280 KIAS at FL) default in the Cockpit; Trainer (140 kt) in Test mode. Airspeed gauge scales with the profile.
- Keys: W/S stick fwd/back, A/D roll, Q/E yaw (rudder; nosewheel steering on the ground), ↑/↓ or +/− throttle. Live stick/rudder deflection display.
- Map: viewport (bbox) loading worldwide; default India only (country=IN), "Whole world" toggle; airport symbols, per-layer legend toggles.

### WORLD DATA + LEGEND (extra, user request) · DONE · 2026-11-21
- `bash scripts/data/download.sh` → data/ourairports (gitignored); seed imports 48,082 airports, 28,708 runway ends, 13,831 navaids (prisma/world.ts + csv.ts), else falls back to VOBL only. VOBL training ILS always added.
- Migration world_data (Airport ident/iata/type/country/municipality, lat/lon indexes), applied via `migrate diff` + `migrate deploy` (migrate dev is interactive).
- API: /api/airports?q= (search) | ?near=lat,lon&radiusNm=; /api/airports/:ident; /api/stations?near=&radiusNm=.
- Client: World.ref + groundElevFt + airports; rebaseWorld() re-centres at 40 NM; nav data refetched around store.navCenter; receivers pick the nearest station on a frequency.
- Map legend on the OSM map.

### MODES + VOBL + OSM (extra, user request) · DONE · 2026-11-21
- Main product = `/cockpit` (no login): every instrument, radio and control in one UI (CockpitPanel + ControlPanel with presets, throttle slider, yoke buttons, flaps, gear). Test mode = `/scenarios` → `/fly/:id` (scored).
- Real data: VOBL Bengaluru from OurAirports (2 runways, 7 VOR-DME, 8 NDB) + training ILS 09L/09R. Origin = 09L threshold, field elevation 3000 ft.
- Map: Leaflet + OpenStreetMap tiles (OsmMap.vue), with the old canvas chart as a "Nav chart" tab. No Google tile scraping (ToS).
- Bug fixed: reseeding changed scenario ids → /fly/1 loaded an empty world ("controls not working"). Seed now TRUNCATE … RESTART IDENTITY.
- New: `npm run test:e2e` (headless Chrome via playwright-core): 8 cockpit checks incl. takeoff, roll, presets.

### ISA-ATMO (extra, user request) · DONE · 2026-11-21
- shared/utils/isa.ts: ICAO ISA (troposphere + stratosphere), QNH + ISA deviation, CAS↔TAS (compressible), Mach, indicated/pressure/density altitude; 15 tests.
- Flight model moves with TAS; IAS for limits; altimeter shows indicated altitude with the baro setting; AirDataPanel (IAS/TAS/Mach/OAT/σ/PA/DA, baro ±/STD/QNH).
- World.atmo, radios.baroHpa, ScenarioConfig.atmosphere; seed: NDB homing ISA+15/QNH 1003, VOR to VOR ISA−10/QNH 1022.
- CONTRACTS §1b added; §3 F1–F4 updated to TAS values; §8 pitchCmd uses TAS.

### W2-CHK · DONE · 2026-11-21
- Unit 63, int 9, smoke all green.
- Human visual check pending (Week 2 list in TESTING.md): register/login, scenarios, NDB homing with the ADF/RMI, wind drift, flight log.
- Next session: start at W3-T17 (ILS).

### W2-T16 · DONE · 2026-11-21
- VorDiagram.vue: DVOR 48-antenna ring / CVOR rotating pattern (slowed), live site error; out-of-range flags already handled by CDI (OFF), ADF and RMI (park at 090).
- Scenario wind flows via buildScenarioWorld; E5 drift test passes.

### W2-T15 · DONE · 2026-11-21
- app/nav/adf.ts (invalid → needle parks at 090 rel), AdfIndicator.vue, RMI.vue (thin green = VOR, thick yellow = NDB); NavRadio gains a coarse prop and is reused as the ADF radio.

### W2-T14 · DONE · 2026-11-21
- app/sim/objectives.ts (+text), World gains objective/objProgress/done/fmsComplete; done stops simStep.
- useFlightSession (start/end once, beforeEnd hooks for the recorder), useScenarioWorld, FlightBanner, pages scenarios/index + flights/index.
- createWorld accepts a Partial ac.

### W2-T13 · DONE · 2026-11-21
- services/{scenarios,flights,scoring.logic,flights.logic}.ts; api scenarios/*, flights/* (incl. samples.post early, from T21).
- endFlight computes meanAbsLocFrac from stored samples for LANDED.

### W2-T12 · DONE · 2026-11-21
- AuthForm.vue (shared login/register), NavBar.vue in the default layout, middleware auth/admin; /fly/* requires login.

### W2-T11 · DONE · 2026-11-21
- server/services/users.ts (bcryptjs), validators/auth.ts, api/auth/*, utils/auth.ts requireUser/requireAdmin.
- shared/types/auth.d.ts augments #auth-utils User {id,name,email,role}.

### W1-CHK · DONE · 2026-11-21
- check, int and smoke all green.
- Human visual check pending: open http://localhost:3000/fly/1 (npm run dev), take off (W to throttle, Down arrow to rotate at 65 kt), tune 113.50, OBS 090, check the CDI/DME.
- Known: harmless Tailwind 'tailwindcss/nesting' PostCSS warning in dev.

### W1-T10 · DONE · 2026-11-21
- engine.simStep computes nav.vor1/dme1; NavRadio (active/standby swap), CDI (OBS buttons, OFF flag), DmeReadout.
- Cockpit: map left, instruments + radios right.

### W1-T08 · DONE · 2026-11-21
- gauges.ts (§11) + dial.ts helpers; Airspeed, Attitude, Altimeter, Heading, VerticalSpeed components.

### W1-T07 · DONE · 2026-11-21
- server/services/navdata.ts; /api/airports, /api/stations(?type), /api/waypoints (added early); useNavData, useCanvas, MapView + mapDraw.ts; fly/[id].vue; layouts/cockpit.vue.
- with-dev.sh: refuses if :3000 busy, setsid + process-group cleanup, warms up / and /fly/1 (first SSR triggers a vite re-optimise restart).

### W1-T09 · DONE · 2026-11-21
- app/nav/{range,vor,dme}.ts; V1–V3, C1–C5, R1–R2, D1 pass.
- tests/unit/helpers/fixtures.ts: SEED_STATIONS (local NM), RWY09, air(), station() for later tests.

### W1-T06 · DONE · 2026-11-21
- app/sim/{engine,input}.ts, app/stores/sim.ts (shallowRef world, trail 1 Hz/600 pts), composables useKeyboard/useSimLoop.
- Engine World has radios {nav1MHz, obsDeg, adfKHz}; tests/unit/engine.test.ts exports run() helper.

### W1-T05 · DONE · 2026-11-21
- app/sim/{flightModel,wind,loop}.ts; F1–F8, L1–L2 + takeoff test pass.
- ROTATE_KT=65 exported from flightModel.

### W1-T03 · DONE · 2026-11-21
- prisma/seedData.ts (pure, local NM → lat/lon) + prisma/seed.ts (idempotent transaction, bcryptjs).
- Seed verified twice; 10 stations. Users admin@skynav.local/admin1234, student@skynav.local/student1234.

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
