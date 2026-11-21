# Week 4: Glass cockpit and autopilot

Week goal: PFD, ND and EICAS with Master Caution/Warning, and an autopilot that flies a coupled ILS approach.

Read only your own card: `sed -n '/^### W4-T2X/,/^### W/p' docs/agent/tasks/week-4.md`

---

### W4-T23 · PFD
**Goal:** one Primary Flight Display replaces the basic gauges in glass mode.
**Contracts:** §2 (AircraftState, IlsOutput), §11 (attitude helpers).
**Read:** `app/composables/useCanvas.ts` (exports only).
**Create:** `app/components/instruments/PFD.vue`, `app/components/instruments/pfdDraw.ts` (pure canvas draw functions, each under 80 lines), `tests/unit/pfdDraw.test.ts`.

**Steps**
- Props: `ac`, `ils`, `fma: { lateral, vertical, armed: string[] }`, `targets: { altFt, hdgDeg, iasKt? }`.
- Layout: the attitude in the centre (sky/ground, pitch ladder every 2.5°, bank scale); the speed tape on the left (10 kt ticks, a red band below 55, an overspeed band above 180); the altitude tape on the right (100 ft ticks, a target bug); the heading tape at the bottom; a VS bar at the far right; the ILS LOC and GS diamonds; the FMA row at the top.
- Put the pure tick math in pfdDraw.ts, e.g. `tapeTicks(value, step, range)`.

**Tests:** `tapeTicks(123, 10, 40)` = [90, 100, …, 160]; `tapeTicks(3450, 100, 400)` = [3000, …, 3900].
**Verify:** `npm run check`.
**Commit:** `feat(glass): primary flight display`

---

### W4-T24 · ND
**Goal:** a Navigation Display with MAP mode, heading-up, and selectable range.
**Deps:** T23. **Contracts:** §2 (NavStation, World fields via the engine exports).
**Read:** `app/sim/engine.ts` (`World` interface only).
**Create:** `app/components/instruments/ND.vue`, `app/components/instruments/ndProject.ts` (pure: world→screen for heading-up), `tests/unit/ndProject.test.ts`.

**Steps**
- Draw a heading-up arc (±60°) with range rings, selectable at 10/20/40/80 NM. Show the stations within range (symbols and idents), the runway, the tuned VOR course line, and a wind arrow with GS/TAS text at the top-left.
- Accept optional `route` and `traffic` props, which are drawn later in W5 and W6.

**Tests:** `project({x:0,y:10}, ac at (0,0) hdg 0)` → straight up; with hdg 90 → to the left.
**Verify:** `npm run check`.
**Commit:** `feat(glass): navigation display`

---

### W4-T25 · Alerts, EICAS, Master Caution/Warning
**Goal:** the warning and caution logic plus the engine/system display.
**Contracts:** §9 (the `alerts` part only; the gpws value is passed in as null for now).
**Create:** `app/systems/alerts.ts`, `tests/unit/alerts.test.ts`, `app/components/instruments/EICAS.vue`, `app/components/instruments/MasterAlerts.vue`. **Modify:** `app/sim/engine.ts` (`world.alerts` each step), `app/pages/fly/[id].vue`.

**Steps**
- **EICAS:** an N1 % arc (throttle×100 with a 2 s lag), a fuel % bar, 3 gear lights (green when down, red in transit for 0.5 s), flaps position, and the alert list (red warnings first, then amber cautions).
- **MasterAlerts:** flashing MASTER WARNING (red) and MASTER CAUTION (amber) buttons. A click acknowledges, and the light comes back only for a new alert.

**Tests:** AL1–AL4, plus LOW FUEL at 8 %.
**Verify:** `npm run check`.
**Commit:** `feat(glass): alerts logic, eicas, master caution/warning`

---

### W4-T26 · Autopilot logic
**Goal:** a pure autopilot proven by closed-loop tests.
**Contracts:** §8, §3 (`step` signature), §6 (`ilsReceive` signature), §14 (ILS station rows).
**Read:** none (use the contracts).
**Create:** `app/systems/autopilot.ts`, `tests/unit/autopilot.test.ts` (with a local `simulate(apState, start, seconds)` helper that runs `step` + `ilsReceive` + `apStep` at dt 1/20).
**Steps:** implement per §8. If AP3 or AP4 fail, tune the *(tunable)* gains, update §8 and note the change in the handoff. **Do not change the test thresholds.**
**Tests:** AP1–AP4.
**Verify:** `npm run test:unit -- tests/unit/autopilot.test.ts`.
**Commit:** `feat(systems): autopilot hdg/nav/app/alt/vs/gs with closed-loop tests`

---

### W4-T27 · MCP, AP wiring, cockpit layouts
**Goal:** fly the coupled ILS from the glass cockpit.
**Deps:** T23–T26. **Contracts:** §8 (ApState only).
**Read:** `app/sim/engine.ts`, `app/stores/sim.ts` (exports only).
**Create:** `app/components/instruments/MCP.vue`, `app/components/views/GlassCockpit.vue`, `app/components/views/ClassicCockpit.vue`. **Modify:** `app/sim/engine.ts` (when `ap.engaged`, `apStep` overrides roll and pitch; any manual roll/pitch key disengages it and adds an `AP DISC` caution for 5 s), `app/stores/sim.ts` (ap state and actions), `app/pages/fly/[id].vue` (a layout toggle, remembered in localStorage inside try/catch), `tests/unit/engine.test.ts`.

**Steps**
- **MCP:** HDG, ALT and VS knobs with displays; buttons AP, HDG, NAV, APP, ALT and VS that light up when active; armed modes shown in white and active ones in green on the PFD FMA.
- **ClassicCockpit:** the gauges + HSI + RMI + radios. **GlassCockpit:** PFD + ND + EICAS + MCP + radios. Both include the map and profile panels.

**Tests:** E8: AP engaged in HDG mode, a roll key pressed → the AP disengages and the caution is present.
**Verify:** `npm run check` and the smoke run.
**Commit:** `feat(glass): mcp, autopilot wiring, classic/glass layouts`

---

### W4-CHK · Week 4 checkpoint
Run the agent checkpoint commands, fix regressions, and write the handoff with the Week 4 human checklist.
**Commit:** `chore: week 4 checkpoint`
