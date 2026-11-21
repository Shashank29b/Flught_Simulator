# Week 5: INS, GPS, FMS

Week goal: show INS drift corrected by GPS, and fly a waypoint route in LNAV.

Read only your own card: `sed -n '/^### W5-T2X/,/^### W/p' docs/agent/tasks/week-5.md`

---

### W5-T28 · INS model
**Goal:** a pure strapdown-style INS with visible drift.
**Contracts:** §10 (the INS part), §1 (random).
**Create:** `app/nav/ins.ts`, `tests/unit/ins.test.ts`.
**Steps:** implement `insInit` and `insStep` per §10, in metres. Keep `prevTrueV` inside the state.
**Tests:** IN1–IN2, plus the same seed giving an identical drift on two runs.
**Verify:** `npm run test:unit -- tests/unit/ins.test.ts`.
**Commit:** `feat(nav): inertial navigation model with sensor bias and noise`

---

### W5-T29 · GPS + blend
**Goal:** a noisy GPS with outages, and a complementary INS/GPS blend.
**Deps:** T28. **Contracts:** §10 (GPS and blend), §1 (random).
**Create:** `app/nav/gps.ts`, `app/nav/blend.ts`, `tests/unit/gps.test.ts`, `tests/unit/blend.test.ts`.
**Tests:** GS1–GS2, BL1, plus: during an outage the correction stays frozen (the blended position drifts with the INS).
**Verify:** `npm run test:unit -- tests/unit/gps.test.ts tests/unit/blend.test.ts`.
**Commit:** `feat(nav): gps fixes with outage and ins/gps complementary blend`

---

### W5-T30 · Waypoints API, FMS, CDU, LNAV
**Goal:** load the route from the scenario, show it on the ND and map, and fly it in LNAV.
**Contracts:** §10 (FMS), §13 (waypoints row), §8 (the LNAV line).
**Read:** `app/sim/engine.ts`, `app/systems/autopilot.ts` (exports only), `scripts/smoke.mjs` (tail).
**Create:** `server/api/waypoints.get.ts` (via `server/services/navdata.ts`), `app/nav/fms.ts`, `tests/unit/fms.test.ts`, `app/components/instruments/CDU.vue`. **Modify:** `app/composables/useNavData.ts` (waypoints → local), `app/sim/engine.ts` (`world.fms`; feeds `lnavHdgDeg` to the AP; `fmsComplete` for the ROUTE objective), `ND.vue` and `MapView.vue` (draw the route with the active leg in magenta), `MCP.vue` (an LNAV button), `scripts/smoke.mjs` (waypoints = 3).

**Steps**
- **CDU:** a list of the route waypoints with the active one highlighted. Allow adding a waypoint by ident (waypoints or stations), deleting one, and EXEC. Show the cross-track error and the distance to the next waypoint.

**Tests:** FM1–FM3. E9: ROUTE scenario with the AP in LNAV for 900 s → fmsComplete (allow up to 1200 s).
**Verify:** `npm run check` and the smoke run.
**Commit:** `feat(fms): waypoints api, fms legs, cdu, lnav`

---

### W5-T31 · INS/GPS in the cockpit
**Goal:** show the true, INS and blended positions, with a nav source selector.
**Deps:** T29, T30. **Contracts:** §10 (signatures only).
**Read:** `app/sim/engine.ts`.
**Create:** `app/components/views/NavSourcePanel.vue`. **Modify:** `app/sim/engine.ts` (run the INS every step using the true velocity from gs/track; take a GPS fix every 1 s of sim time; blend; the RNG is seeded from the flight start: `mulberry32(42)` in tests), `MapView.vue` (dots: true white, INS orange, blended green), `app/pages/fly/[id].vue`, `tests/unit/engine.test.ts`.

**Steps**
- **NavSourcePanel:** a selector (INS / GPS / BLEND) for the position used by the ND and FMS. It shows the error in metres from the truth for each source, GPS satellites as a fake count (8, or 0 during an outage), and a "Simulate GPS outage" toggle.

**Tests:** E10: 300 s straight flight; INS error > 100 m; blended error < 30 m.
**Verify:** `npm run check`.
**Commit:** `feat(cockpit): ins/gps/blend display and nav source selector`

---

### W5-CHK · Week 5 checkpoint
Run the agent checkpoint commands, fix regressions, and write the handoff with the Week 5 human checklist.
**Commit:** `chore: week 5 checkpoint`
