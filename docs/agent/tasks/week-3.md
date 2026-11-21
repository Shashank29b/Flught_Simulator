# Week 3: ILS approach, landing, scoring, replay

Week goal: fly the ILS approach to runway 09, land, get a score and replay the flight. **This is the lab-assessment minimum.**

Read only your own card: `sed -n '/^### W3-T1X/,/^### W/p' docs/agent/tasks/week-3.md`

---

### W3-T17 · ILS, markers, radio altimeter logic
**Goal:** pure ILS receivers wired into the engine.
**Contracts:** §6, §2 (IlsOutput, MarkerOutput, NavOutputs).
**Read:** `app/sim/engine.ts`.
**Create:** `app/nav/ils.ts`, `app/nav/markers.ts`, `app/nav/radioAlt.ts`, `tests/unit/ils.test.ts`, `tests/unit/markers.test.ts`. **Modify:** `app/sim/engine.ts` (when nav1 matches an ILS_LOC, compute `nav.ils` with that station's runway; always compute `nav.markers` and `nav.raFt`), `tests/unit/engine.test.ts`.
**Tests:** I1–I4, S1–S3, M1–M2, RA1, CO1–CO2. E6: seeded ILS, aircraft at (−8, 0), alt 900 + 8.16·6076.12·tan 3° → |locDevDeg| < 0.05, |gsDevDeg| < 0.05.
**Verify:** `npm run check`.
**Commit:** `feat(nav): ils localiser, glide slope, marker beacons, radio altimeter`

---

### W3-T18 · HSI, marker lights, RA readout, audio
**Goal:** the cockpit shows the ILS on an HSI with marker lights and callouts.
**Deps:** T17. **Contracts:** §6 (`callouts` signature).
**Read:** `app/components/instruments/CDI.vue` (props only).
**Create:** `app/components/instruments/HSI.vue`, `app/components/instruments/MarkerLights.vue`, `app/components/instruments/RadioAltimeter.vue`, `app/composables/useAudio.ts`. **Modify:** `app/pages/fly/[id].vue` (show the HSI in place of the CDI when an ILS is tuned, or always with a toggle).

**Steps**
- **HSI:** a rotating compass card. The course arrow is the OBS, or the runway heading for an ILS. The deviation bar comes from `cdiFrac` or `locFrac`; 2 dots per side. There's a GS pointer on the right edge (`gsFrac`, hidden when invalid), a TO/FROM triangle, and NAV and GS flags.
- **MarkerLights:** OM blue, MM amber, IM white, each blinking while active.
- **useAudio:** starts muted, with an unmute button (a browser gesture is needed). Uses a WebAudio oscillator for the markers: OM 400 Hz dashes, MM 1300 Hz dot-dash, IM 3000 Hz dots. Callouts use `speechSynthesis` ("one thousand", "five hundred", "one hundred", "fifty").
- **RadioAltimeter:** the number in feet, hidden when null.

**Verify:** `npm run check`; smoke `/fly/5` returns 200.
**Commit:** `feat(instruments): hsi, marker lights, radio altimeter, audio cues`

---

### W3-T19 · Profile view
**Goal:** a side view of the approach.
**Deps:** T17. **Contracts:** §14 (runway, GS and marker positions).
**Create:** `app/components/views/ProfileView.vue`. **Modify:** `app/pages/fly/[id].vue`.
**Steps:** the x-axis is the distance to the threshold, 15 NM → 0; the y-axis is height AGL, 0–5000 ft. Draw the 3° glide path line from the GS antenna, tick marks at OM/MM/IM, the aircraft dot plus its last 2 minutes of trail, and the current deviation text.
**Verify:** `npm run check`.
**Commit:** `feat(views): approach profile view`

---

### W3-T20 · Touchdown judge, end of flight
**Goal:** a touchdown ends the flight as LANDED or CRASHED and shows a result.
**Deps:** T17. **Contracts:** §7 (`judgeTouchdown`), §3 rule 6.
**Read:** `app/sim/engine.ts`, `app/components/views/FlightBanner.vue` (props/emits only).
**Create:** `app/sim/landing.ts`, `tests/unit/landing.test.ts`. **Modify:** `app/sim/engine.ts` (detect the airborne→ground transition; judge with the previous state and the scenario runway; set `world.done` and `world.landing`), `FlightBanner.vue` (result modal: LANDED/CRASHED, reasons, lateral offset, touchdown rate), `tests/unit/engine.test.ts`.
**Steps:** the cockpit sends `PATCH /end` with `result` and `landing`. Ending also stops the sim loop.
**Tests:** T1–T5. E7: start at (0.1, 0), alt 930, vs −400 → after a few steps `world.done`, LANDED.
**Verify:** `npm run check`.
**Commit:** `feat(sim): touchdown judge, landing/crash end of flight`

---

### W3-T21 · Recorder, samples API, scoring from samples
**Goal:** flights are recorded at 5 Hz, uploaded in batches, and scored using the localiser tracking.
**Deps:** T20. **Contracts:** §13 (samples and end rows), §2 (FlightSampleInput), §7 (score, LANDED part).
**Read:** `server/services/flights.ts` (exports only), `server/services/scoring.logic.ts`.
**Create:** `app/composables/useRecorder.ts`, `server/api/flights/[id]/samples.post.ts`, `server/services/flights.logic.ts` (`meanAbsLocFrac(samples)`: samples with −4 ≤ x ≤ 0 that have `nav.locFrac`), `tests/unit/flightsLogic.test.ts`. **Modify:** `server/validators/flights.ts`, `server/services/flights.ts` (`addSamples`; `endFlight` loads the samples to compute meanAbsLocFrac for LANDED), `app/pages/fly/[id].vue`, `tests/int/flights.test.ts`, `scripts/smoke.mjs`.

**Steps**
- `useRecorder(flightId)` samples every 200 ms of **sim time** into a buffer. It POSTs when the buffer reaches 25 samples, and `flush()` is awaited before `PATCH end`.
- Validation: 1–100 samples per request; 409 if the flight has ended; 403 if the user isn't the owner.
- Smoke: start a flight, post 25 samples, end LANDED with `landing` → score > 0; `GET` the flight → 25 samples.

**Tests:** unit: meanAbsLocFrac of [0.2, −0.2, 0.4] = 0.2667; samples outside 4 NM are ignored. Int: post samples → count; 409 after end.
**Verify:** `npm run check`, `npm run test:int`, smoke.
**Commit:** `feat(recorder): flight recorder, samples api, tracking-based score`

---

### W3-T22 · Replay page
**Goal:** `/flights/:id` shows the track, graphs, score and a scrubber.
**Deps:** T21. **Contracts:** §13 (`GET /api/flights/:id`).
**Create:** `app/pages/flights/[id].vue`, `app/components/views/TrackPlot.vue`, `app/components/views/LineChart.vue`.

**Steps**
- `TrackPlot`: a static map fitted to the track bounds, with the runway and stations, the track coloured by altitude, and a marker at the scrubbed time.
- `LineChart` is a generic canvas chart (props: series, y-label, y-range). Use it 3 times: altitude, locDevDeg, gsDevDeg.
- Score card: total plus the details, result badge, scenario title and duration. A range-input scrubber moves the markers.

**Verify:** `npm run check`; smoke: after the T21 flight, `GET /flights/<id>` page returns 200.
**Commit:** `feat(replay): flight replay with track, graphs, score`

---

### W3-CHK · Week 3 checkpoint
Run the agent checkpoint commands, fix regressions, and write the handoff with the Week 3 human checklist. Tag the commit: `git tag v0.3-lab-minimum`.
**Commit:** `chore: week 3 checkpoint (lab minimum)`
