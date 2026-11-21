# Week 2: Accounts, scenarios, ADF/RMI/DVOR

Week goal: a user logs in, picks a scenario, flies it with VOR/ADF/RMI, and the flight is saved and listed.

Read only your own card: `sed -n '/^### W2-T1X/,/^### W/p' docs/agent/tasks/week-2.md`

---

### W2-T11 · Auth API + guards
**Goal:** register, login, logout and me endpoints, plus the server guards `requireUser` and `requireAdmin`.
**Contracts:** §13 (auth rows + the paragraph under the table).
**Read:** `server/utils/prisma.ts`, `tests/int/helpers.ts` (exports only), `scripts/smoke.mjs` (tail).
**Create:** `server/validators/auth.ts`, `server/services/users.ts`, `server/utils/auth.ts`, `server/api/auth/{register.post,login.post,logout.post,me.get}.ts`, `tests/int/users.test.ts`.

**Steps**
1. Zod schemas: `registerSchema`, `loginSchema`. Lower-case the emails.
2. `users.ts`: `createUser(prisma, input)` throws 409 on a duplicate email; `verifyLogin(prisma, email, pw)` returns the user or null (bcryptjs). Never return `passwordHash`.
3. Handlers: on register and login call `setUserSession(event, { user: { id, name, email, role } })`; logout calls `clearUserSession`; me calls `requireUserSession`.
4. `server/utils/auth.ts`: `requireUser(event)` returns the session user; `requireAdmin(event)` throws 403 when the role is not ADMIN.
5. Smoke: register a random email, log in, `me` returns 200, log out, `me` returns 401. A wrong password returns 401.

**Tests (int):** create → verifyLogin ok; wrong password → null; duplicate → 409; email is case-insensitive.
**Verify:** `npm run test:int 2>&1 | tail -n 15` and `bash scripts/with-dev.sh npm run smoke 2>&1 | tail -n 15`
**Commit:** `feat(auth): register/login/logout/me with session + guards`

---

### W2-T12 · Login/register pages, route middleware, navbar
**Goal:** a UI for auth; the cockpit and flight pages require login.
**Deps:** T11. **Contracts:** none.
**Create:** `app/pages/login.vue`, `app/pages/register.vue`, `app/middleware/auth.ts`, `app/middleware/admin.ts`. **Modify:** `app/layouts/default.vue` (navbar: Home, Scenarios, Flights, Admin for admins only, user name, Logout), `app/pages/fly/[id].vue` and future `flights` pages (`definePageMeta({ middleware: 'auth' })`).

**Steps**
- The forms use `$fetch` and show errors inline. After login, call `useUserSession().fetch()` and redirect to `/scenarios`.
- `auth.ts` redirects to `/login?next=…` when the user isn't logged in. `admin.ts` redirects to `/` when the role isn't ADMIN.

**Verify:** `npm run check`; smoke pages `/login` and `/register` return 200.
**Commit:** `feat(auth-ui): login/register pages, route guards, navbar`

---

### W2-T13 · Scenarios + flights API (and the score logic)
**Goal:** list and get scenarios; start, end and list flights; compute the score server-side.
**Deps:** T11. **Contracts:** §13 (scenarios and flights rows except samples), §7 (`score` only), §2 (ScenarioDTO, FlightResult).
**Create:** `server/services/scenarios.ts`, `server/services/flights.ts`, `server/services/scoring.logic.ts`, `server/validators/flights.ts`, `server/api/scenarios/index.get.ts`, `server/api/scenarios/[id].get.ts`, `server/api/flights/index.post.ts`, `server/api/flights/index.get.ts`, `server/api/flights/[id].get.ts`, `server/api/flights/[id]/end.patch.ts`, `tests/unit/scoring.test.ts`, `tests/int/flights.test.ts`.

**Steps**
1. `scoring.logic.ts`: `score()` exactly as in §7. For now `meanAbsLocFrac` defaults to 0 when it isn't provided; T21 computes it from the samples.
2. `flights.ts`: `startFlight(prisma, userId, scenarioId)`, `endFlight(prisma, userId, flightId, body)`, which returns 403 if the user isn't the owner and 409 if the flight is already ended, sets `endedAt` and the result, and upserts the Score. It also has `listFlights(prisma, user, all)` and `getFlight(prisma, user, id)`.
3. `GET /api/scenarios/:id` maps `config` to a `ScenarioDTO`.
4. Smoke: scenarios ≥ 9; start a flight on scenario 1; end it ABORTED → score 0; end it again → 409.

**Tests:** unit S1–S3. Int: start/end flow; 403 for another user; 409 on a double end; the list is newest first.
**Verify:** `npm run test:unit -- tests/unit/scoring.test.ts`, `npm run test:int`, smoke.
**Commit:** `feat(api): scenarios and flight sessions with scoring`

---

### W2-T14 · Scenario flow in the UI
**Goal:** pick a scenario, which loads it into the cockpit; the flight starts and ends via the API; objectives complete; a flight log page.
**Deps:** T12, T13. **Contracts:** §7 (`evaluateObjective` only), §2 (Objective, ScenarioDTO).
**Read:** `app/sim/engine.ts`, `app/stores/sim.ts` (exports only).
**Create:** `app/sim/objectives.ts`, `tests/unit/objectives.test.ts`, `app/pages/scenarios/index.vue`, `app/pages/flights/index.vue`, `app/components/views/FlightBanner.vue`. **Modify:** `app/sim/engine.ts` (holds `objective` and `objProgress`; sets `world.done` when the objective is met), `app/pages/fly/[id].vue`.

**Steps**
1. Scenarios page: cards grouped by week, with a title, description and a "Fly" button linking to `/fly/:id`.
2. Cockpit: fetch the `ScenarioDTO` and build the world from `DEFAULT_STATE` merged with `startState`, plus the radios and wind. Then `POST /api/flights` and store the flightId.
3. `FlightBanner`: shows the objective text and progress (e.g. "Hold radial: 34/60 s"), with an "End flight" button that sends `PATCH end ABORTED`. When the objective is done, send `PATCH end COMPLETED`, show the score and offer "Back to scenarios".
4. Flights page: a table of date, scenario, result and score, with each row linking to `/flights/:id` (the page comes in W3).

**Tests:** O1–O2, plus REACH done at 0.4 NM when withinNm is 0.5.
**Verify:** `npm run check`; smoke pages `/scenarios` and `/flights` return 200.
**Commit:** `feat(scenarios): scenario selection, objectives, flight start/end, flight log`

---

### W2-T15 · ADF, AdfRadio, RMI
**Goal:** NDB homing works; the RMI shows the VOR and ADF bearings.
**Contracts:** §5, §2 (AdfOutput).
**Read:** `app/sim/engine.ts`.
**Create:** `app/nav/adf.ts`, `tests/unit/adf.test.ts`, `app/components/radios/AdfRadio.vue`, `app/components/instruments/RMI.vue`, `app/components/instruments/AdfIndicator.vue`. **Modify:** `app/sim/engine.ts` (nav.adf), `tests/unit/engine.test.ts`, `app/pages/fly/[id].vue`.

**Steps**
- `AdfRadio`: 190–1750 kHz in 1 and 10 kHz steps.
- `AdfIndicator`: a fixed card with the needle at `relBearingDeg`.
- `RMI`: a compass card rotating with the heading. Needle 1 (thin) points to the VOR station (`radial + 180`); needle 2 (thick) points to `adf.bearingToDeg`. An invalid needle parks at 3 o'clock.

**Tests:** A1–A4. E4: world with NB, aircraft at (−25, −2), hdg 180, adf 350 → relBearing ≈ 0.
**Verify:** `npm run check`.
**Commit:** `feat(nav): adf receiver, adf radio, rmi`

---

### W2-T16 · DVOR visual, failure flags, wind
**Goal:** teach the CVOR vs DVOR difference; show proper flags when out of range; apply wind from the scenario.
**Deps:** T14, T15. **Contracts:** §4 (site error line), §3 rule 7.
**Read:** `app/sim/engine.ts`, `app/components/instruments/CDI.vue` (props only).
**Create:** `app/components/views/VorDiagram.vue`. **Modify:** `app/pages/fly/[id].vue`, `app/components/views/MapView.vue` (wind arrow plus GS/track text), `tests/unit/engine.test.ts`.

**Steps**
- `VorDiagram`: a small panel for the tuned station. For a **DVOR**, show the ring of 48 antennas with the lit one rotating at 30 rev/s (shown slowed down) and the reference signal at the centre. For a **CVOR**, show a rotating figure-8 pattern. Print the current site error, `radial - trueBearing`, in degrees.
- The CDI, ADF and RMI must show flags when the receiver is invalid; check this works when flying out of range.

**Tests:** E5: wind from 270 at 20 kt, hdg 0, 60 s → x increases by ≈ 0.33 NM (±0.02).
**Verify:** `npm run check` and the smoke run.
**Commit:** `feat(nav): dvor/cvor diagram, range flags, scenario wind`

---

### W2-CHK · Week 2 checkpoint
Run the agent checkpoint commands in TESTING.md, fix regressions, and write the handoff with the Week 2 human checklist.
**Commit:** `chore: week 2 checkpoint`
