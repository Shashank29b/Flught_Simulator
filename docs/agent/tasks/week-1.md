# Week 1: Setup, flying, VOR/DME

Week goal: the app and DB run, and you can fly a VOR radial with the DME counting, using stations loaded from PostgreSQL.

Read only your own card: `sed -n '/^### W1-T0X/,/^### W/p' docs/agent/tasks/week-1.md`

---

### W1-T01 · Scaffold the Nuxt app
**Goal:** an empty Nuxt 4 app with every module and tool installed, and `npm run check` green.
**Contracts:** none. **Read:** `AGENTS.md`, `docs/agent/TESTING.md` (Config section only).
**Create:** `package.json`, `nuxt.config.ts`, `app/app.vue`, `app/layouts/default.vue`, `app/pages/index.vue`, `vitest.config.ts`, `eslint.config.mjs`, `.env`, `.env.example`, `.gitignore`, `tests/unit/sanity.test.ts`, empty folders (with `.gitkeep`): `app/{sim,nav,systems,stores,composables,components/instruments,components/radios,components/views,middleware}`, `server/{api,services,utils,validators}`, `shared/{types,utils}`, `tests/{unit,int}`, `scripts`, `docker/initdb`.

**Steps**
1. `git init` (if the repo has none). The repo already contains `AGENTS.md`, `CLAUDE.md` and `docs/`; keep them.
2. Scaffold into a temp folder and merge it in without overwriting:
   `npx nuxi@latest init _scaffold --packageManager npm --gitInit false 2>&1 | tail -n 5`
   `cp -rn _scaffold/. . && rm -rf _scaffold && npm install 2>&1 | tail -n 5`
   Confirm that the `app/` folder exists (Nuxt 4 layout).
3. Add modules: `npx nuxi module add pinia`, `npx nuxi module add tailwindcss`, `npx nuxi module add auth-utils`, `npx nuxi module add eslint`.
4. `npm i zod bcryptjs` and `npm i -D vitest vue-tsc typescript @types/bcryptjs tsx`.
5. `nuxt.config.ts`: set `devtools: { enabled: false }` and `typescript: { strict: true }`. Keep the module list.
6. Add these `package.json` scripts:
   `"test:unit": "vitest run --reporter=dot"`, `"test:int": "vitest run -c vitest.int.config.ts --reporter=dot"`,
   `"lint": "eslint ."`, `"typecheck": "nuxi typecheck"`, `"check": "npm run typecheck && npm run lint && npm run test:unit"`, `"smoke": "node scripts/smoke.mjs"`.
7. `vitest.config.ts` per TESTING.md. `tests/unit/sanity.test.ts`: `expect(1+1).toBe(2)`.
8. Create `.env.example` with `DATABASE_URL`, `TEST_DATABASE_URL` and `NUXT_APP_SECRET`. Make `.env` a copy whose password is `openssl rand -hex 32`. `.gitignore` must contain `.env`.
9. `app/app.vue` → `<NuxtLayout><NuxtPage /></NuxtLayout>`. The default layout has a dark header saying "SkyNav Sim". `index.vue` has a heading plus a link to `/fly/1`.

**Verify**
`npm run check 2>&1 | tail -n 20` passes, and `npm run build 2>&1 | tail -n 5` succeeds.
**Done when:** both commands are green. **Commit:** `chore: scaffold nuxt app with pinia, tailwind, auth-utils, eslint, vitest`

---

### W1-T02 · Database, Prisma, health API, dev scripts
**Goal:** PostgreSQL runs in Docker, the Prisma schema is migrated, and `/api/health` reports the DB status.
**Contracts:** §12. **Read:** `docs/agent/TESTING.md` (Config + Scripts sections).
**Create:** `docker-compose.yml`, `docker/initdb/01-test-db.sql`, `prisma/schema.prisma`, `server/utils/prisma.ts`, `server/api/health.get.ts`, `scripts/with-dev.sh`, `scripts/smoke.mjs`, `vitest.int.config.ts`, `tests/int/globalSetup.ts`, `tests/int/helpers.ts`, `tests/int/health.test.ts`.

**Steps**
1. `docker-compose.yml`: a `db` service using `postgres:17`, user/password/db `skynav`, port 5432, volume `pgdata`, mounting `./docker/initdb:/docker-entrypoint-initdb.d:ro`, with a healthcheck of `pg_isready -U skynav`.
2. `.env`: `DATABASE_URL=postgresql://skynav:skynav@localhost:5432/skynav` and `TEST_DATABASE_URL=postgresql://skynav:skynav@localhost:5432/skynav_test`.
3. `npm i @prisma/client@6` and `npm i -D prisma@6`. Copy the §12 schema exactly.
4. `docker compose up -d db`, then `npx prisma migrate dev --name init 2>&1 | tail -n 5`.
5. `server/utils/prisma.ts`: a PrismaClient singleton stored on `globalThis` in dev.
6. `health.get.ts`: try `prisma.$queryRaw\`SELECT 1\`` and return `{ ok: true, db: true|false }`.
7. Create `scripts/with-dev.sh` exactly as in TESTING.md, then `chmod +x`.
8. `scripts/smoke.mjs`: a tiny runner with `check(name, async fn)`, `BASE = process.env.BASE_URL ?? 'http://localhost:3000'`, and a cookie jar (store `set-cookie`, send it as `cookie`). It prints a PASS/FAIL line per check and exits 1 on any failure. First check: health with db true; also check that `/` returns 200.
9. Create the integration config, globalSetup and helpers per TESTING.md. `health.test.ts`: `prisma.$queryRaw` SELECT 1 works on the test DB.

**Verify**
`npm run test:int 2>&1 | tail -n 15` and `bash scripts/with-dev.sh npm run smoke 2>&1 | tail -n 10`.
**Done when:** both pass. **Commit:** `feat(db): postgres, prisma schema, health endpoint, smoke + int test setup`

---

### W1-T03 · Seed data
**Goal:** an idempotent seed with the airport, runway, stations, waypoints, users and scenarios.
**Deps:** T02, T04. **Contracts:** §14, §2 (ScenarioDTO only), §1 (geo only).
**Read:** `shared/utils/geo.ts` (exports only: `grep -n export shared/utils/geo.ts`).
**Create:** `prisma/seedData.ts` (pure data built with `toLatLon`), `prisma/seed.ts` (DB writes), `tests/unit/seedData.test.ts`. **Modify:** `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }`).

**Steps**
1. `seedData.ts` exports `airport`, `runway`, `stations[]`, `waypoints[]`, `users[]` (plain passwords) and `scenarios[]` with `config`. Write positions in local NM and convert them with `toLatLon`. Use relative imports.
2. `seed.ts` uses one transaction: delete from every table (children first), then insert. Hash passwords with `bcryptjs.hash(pw, 10)`. Link the ILS and marker stations to runway 09.
3. Tests: 10 stations; 3 waypoints; 9 scenarios; `toLocal` of TRN's lat/lon is (2, 6) ±1e-6; the ILS_LOC station has a runway ref; every scenario `config.target.type` is valid.

**Verify**
`npm run test:unit -- tests/unit/seedData.test.ts`, `npx prisma db seed 2>&1 | tail -n 5` run twice (it must be idempotent), and
`docker compose exec -T db psql -U skynav -d skynav -c 'select type, ident, frequency from "NavStation" order by id'`
**Done when:** the seed runs twice without errors and there are 10 station rows. **Commit:** `feat(db): seed training airfield, nav aids, users, scenarios`

---

### W1-T04 · Shared units, geo, random, types
**Goal:** the pure foundation every other module imports.
**Contracts:** §1, §2. **Read:** nothing else.
**Create:** `shared/utils/units.ts`, `shared/utils/geo.ts`, `shared/utils/random.ts`, `shared/types/index.ts`, `tests/unit/geo.test.ts`.
**Steps:** implement exactly as §1 and §2 specify. There are no Nuxt imports.
**Tests:** U1–U2, G1–G5, R1.
**Verify:** `npm run check 2>&1 | tail -n 15`
**Done when:** all tests pass. **Commit:** `feat(shared): units, geo, random, shared types`

---

### W1-T05 · Flight model, wind, loop helper
**Goal:** the pure aircraft physics.
**Deps:** T04. **Contracts:** §3 (and §1 constants).
**Create:** `app/sim/flightModel.ts` (`DEFAULT_STATE`, `step`), `app/sim/wind.ts` (`applyWind(hdg, ias, wind) → { gsKt, trackDeg, vxKt, vyKt }`), `app/sim/loop.ts` (`advance`), `tests/unit/flightModel.test.ts`, `tests/unit/loop.test.ts`.
**Steps:** follow the §3 rules in order. Add a helper `runFor(state, controls, wind, seconds, dt)` in the test file only.
**Tests:** F1–F8, L1–L2.
**Verify:** `npm run test:unit -- tests/unit/flightModel.test.ts tests/unit/loop.test.ts`
**Done when:** all tests pass and `npm run check` is green. **Commit:** `feat(sim): point-mass flight model, wind, fixed-step loop`

---

### W1-T06 · Engine, sim store, keyboard, loop composable
**Goal:** one pure `engine.ts` combines all the modules. The Pinia store calls it at 60 Hz from `requestAnimationFrame`.
**Deps:** T05. **Contracts:** §2, §3.
**Create:** `app/sim/engine.ts`, `app/sim/input.ts`, `app/stores/sim.ts`, `app/composables/useSimLoop.ts`, `app/composables/useKeyboard.ts`, `tests/unit/engine.test.ts`, `tests/unit/input.test.ts`.

**Steps**
1. `engine.ts`:
   ```ts
   export interface World { ac: AircraftState; simMs: number; wind: Wind | null; stations: NavStation[]; runways: RunwayInfo[];
     radios: { nav1MHz: number; obsDeg: number; adfKHz: number }; nav: Partial<NavOutputs> }
   export function createWorld(init: Partial<World>): World
   export function simStep(w: World, c: Controls, dt: number): World   // for now: flight model only; later tasks add receivers here
   ```
2. `input.ts`: `keysToControls(keys: Set<string>, throttle: number, dt): Controls`. ArrowLeft/Right set roll −1/+1. ArrowUp sets pitch −1 (nose down) and ArrowDown sets pitch +1. W/S change the throttle by ±0.5 per second, clamped to 0..1.
3. `stores/sim.ts` (setup store): `world = shallowRef<World>()`, `paused`, `keys` (Set), with actions `load(world)`, `tick(dt)`, `toggleGear()`, `cycleFlaps()`, `setRadio(partial)`. Replace `world.value` with the new object on every tick; never mutate it deeply.
4. `useKeyboard()`: keydown/keyup listeners write `store.keys`. G toggles the gear, F cycles the flaps, P pauses and R resets; call `preventDefault` for the arrow keys. Clean up `onUnmounted`.
5. `useSimLoop()`: a rAF loop that calls `advance()` and then `store.tick(1/60)` `steps` times. It stops when unmounted and skips while paused.

**Tests:** E1: `simStep` on the runway with zero controls for 5 s → x, y unchanged. E2: throttle 1 for 40 s → airborne after pitching up when ias ≥ 65 (scripted). K1: ArrowLeft → roll −1. K2: W held for 1 s from 0 → throttle 0.5. K3: throttle clamps at 1.
**Verify:** `npm run check 2>&1 | tail -n 15`
**Done when:** tests pass. **Commit:** `feat(sim): engine, pinia sim store, keyboard + rAF loop`

---

### W1-T07 · Nav data API, cockpit page, map
**Goal:** `/fly/[id]` loads stations from the DB and shows a moving map with the aircraft.
**Deps:** T03, T06. **Contracts:** §13 (airports, stations rows only), §2 (NavStation, RunwayInfo), §14 (positions only).
**Read:** `app/stores/sim.ts` (exports only), `scripts/smoke.mjs` (to append to).
**Create:** `server/services/navdata.ts`, `server/api/airports.get.ts`, `server/api/stations/index.get.ts`, `app/composables/useNavData.ts`, `app/pages/fly/[id].vue`, `app/layouts/cockpit.vue`, `app/components/views/MapView.vue`, `app/composables/useCanvas.ts`.

**Steps**
1. The service and handlers return the shapes in §13. `?type=` filters by station type (validate it with a Zod enum).
2. `useNavData()`: `useFetch` both endpoints and convert them with `toLocal` into `NavStation[]` and `RunwayInfo[]` (computed).
3. `useCanvas(canvasRef, draw)`: handles devicePixelRatio and resize, and redraws when called. Reuse it for every instrument.
4. `MapView.vue`: props `world`. Use a north-up map centred on the aircraft, with zoom buttons (5/10/20/40/80 NM across). Draw:
   - the runway as a rectangle
   - VOR as a hexagon, DVOR as a hexagon with a circle, NDB as a dotted circle, ILS LOC as a feather and markers as small ellipses
   - ident labels, a trail of the last 600 positions, the aircraft as a rotated triangle, and a 10 NM scale bar
5. `fly/[id].vue` uses the cockpit layout, `useKeyboard()` and `useSimLoop()`. On mount it loads the world with `DEFAULT_STATE` and the stations. The route param is ignored until W2-T14. Wrap the canvas parts in `<ClientOnly>`. Show a small HUD text line: IAS, ALT, HDG and throttle %.
6. Append smoke checks: `/api/airports` contains XTRN; `/api/stations` has ≥ 10; `/fly/1` returns 200.

**Verify:** `npm run check` and `bash scripts/with-dev.sh npm run smoke 2>&1 | tail -n 15`
**Done when:** smoke passes. *(Human: the aircraft moves on the map with the keys.)* **Commit:** `feat(cockpit): nav data api, cockpit page, moving map`

---

### W1-T08 · Gauge helpers + five basic instruments
**Goal:** Airspeed, Attitude, Altimeter, Heading and VSI canvases driven by the world state.
**Deps:** T06. **Contracts:** §11.
**Read:** `app/composables/useCanvas.ts` (from T07; if T07 isn't done, create `useCanvas` here per the T07 step 3 description).
**Create:** `app/components/instruments/gauges.ts`, `AirspeedIndicator.vue`, `AttitudeIndicator.vue`, `Altimeter.vue`, `HeadingIndicator.vue`, `VerticalSpeed.vue`, `tests/unit/gauges.test.ts`. **Modify:** `app/pages/fly/[id].vue` (add a row of instruments).
**Steps:** each component takes one numeric prop group (e.g. `{ iasKt }`). Use a round dark bezel, white ticks and labels, and redraw on prop change. Keep each component under 120 lines. If this task needs more than 400 lines, split it: **a** = gauges.ts + Airspeed + Altimeter + VSI, **b** = Attitude + Heading.
**Tests:** the §11 vectors.
**Verify:** `npm run check 2>&1 | tail -n 15`, then the smoke `/fly/1` check returns 200.
**Done when:** tests pass and the page renders. **Commit:** `feat(instruments): basic six-pack gauges`

---

### W1-T09 · Range, VOR, DME receivers
**Goal:** pure receivers, reused from the earlier VOR project where possible.
**Deps:** T04. **Contracts:** §4.
**Create:** `app/nav/range.ts`, `app/nav/vor.ts`, `app/nav/dme.ts`, `tests/unit/vor.test.ts`, `tests/unit/dme.test.ts`.
**Steps:** implement per §4. Match the frequency with `Math.abs(f - st.frequency) < 0.001`. If no station matches, return a `valid: false` output with zero values.
**Tests:** V1–V3, C1–C5, R1–R2, D1, plus "wrong frequency → valid false".
**Verify:** `npm run test:unit -- tests/unit/vor.test.ts tests/unit/dme.test.ts`
**Done when:** all tests pass. **Commit:** `feat(nav): vor, dvor site error, cdi, dme, signal range`

---

### W1-T10 · NavRadio, CDI, receivers in the engine
**Goal:** tune 113.50, set the OBS and fly the radial on the CDI with the DME showing.
**Deps:** T07, T08, T09. **Contracts:** §4 (signatures only), §2 (VorOutput, DmeOutput).
**Read:** `app/sim/engine.ts`, `app/stores/sim.ts` (exports only).
**Create:** `app/components/radios/NavRadio.vue`, `app/components/instruments/CDI.vue`, `app/components/instruments/DmeReadout.vue`. **Modify:** `app/sim/engine.ts` (call `vorReceive` and `dmeReceive` each step, storing `nav.vor1` and `nav.dme1`), `app/pages/fly/[id].vue`, `tests/unit/engine.test.ts`.

**Steps**
1. `NavRadio`: active and standby frequencies with a swap button. The knobs step whole MHz and 0.05 MHz within 108.00–117.95. It calls `store.setRadio`.
2. `CDI`: an OBS knob (±1° per click, ±10° with shift); a needle from `cdiFrac` with 5 dots each side; a TO/FROM/OFF flag (a red OFF flag when invalid); and the ident text.
3. `DmeReadout`: shows `12.4 NM`, or `---` when invalid.

**Tests:** E3: world with the seeded TRN at (2,6), aircraft at (−10, 6) alt 3900, nav1 113.50, obs 90 → vor1 valid, toFrom TO, |cdiDevDeg| < 0.5, dme1 ≈ 12.0 ±0.2.
**Verify:** `npm run check` and the smoke run.
**Done when:** tests pass. *(Human: the Week 1 visual checklist.)* **Commit:** `feat(cockpit): nav radio, cdi, dme wired to engine`

---

### W1-CHK · Week 1 checkpoint
Run the agent checkpoint commands in TESTING.md. Fix only regressions, as small fixes. In PROGRESS.md, list what the human should check (the Week 1 visual list) and any known issues.
**Commit:** `chore: week 1 checkpoint`
