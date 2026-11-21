# SkyNav Sim: Plan v2

Updated 2026-11-21. It replaces the order of the original 6-week plan (`../FLIGHT_SIM_PLAN.md`, `docs/agent/tasks/`) for the remaining work.

## Where we are
**Done:**
- **Weeks 1–2:** flight model, gauges, VOR/DME, ADF/RMI, DVOR, wind, login, Test mode scenarios, scoring API, flight log.
- **Week 3 (part):** ILS logic, HSI, marker beacons, radio altimeter, sound.
- **Extras:**
  - Journey autopilot (auto take-off to landing)
  - Worldwide OurAirports data on OpenStreetMap
  - ISA atmosphere
  - Jet and trainer profiles
  - Triple-tap explanations
  - Speed and sim-speed controls
  - Setup guide

**Quality:** 112 unit tests, database integration tests, an API smoke test and an 11-check browser test, all green.

## Remaining work, in priority order
| # | Goal | Tasks | Done when | Effort |
|---|---|---|---|---|
| **P1** | **Landing scoring and replay** (lab-assessment minimum) | touchdown judge (W3-T20) · flight recorder (W3-T21) · replay page (W3-T22) | Fly the ILS in Test mode, land, get a score, and replay the flight with graphs | 2–3 h |
| **P2** | **Autopilot modes** | AP logic HDG/ALT/VS/NAV/APP (W4-T26) · MCP panel (W4-T27) | Select modes on the MCP; APP flies a coupled ILS by itself | 2 h |
| **P3** | **Glass cockpit** | PFD (W4-T23) · ND (W4-T24) | PFD and ND show the flight; coupled ILS flown on the glass displays | 2 h |
| **P4** | **INS / GPS** | INS drift (W5-T28) · GPS + blend (W5-T29) · map display and source selector (W5-T31) | INS position drifts; GPS corrects it; visible on the map | 2 h |
| **P5** | **One-command deployment and release** | Dockerfile + compose (W6-T35) · final regression, demo script, v1.0 | `docker compose up` runs the whole app; all tests green; tagged v1.0 | 1–2 h |

**Total: about 9–11 h.**

## Optional (only if time allows)
- Approach profile view (W3-T19)
- EICAS and Master Caution/Warning (W4-T25)
- FMS route, CDU and LNAV (W5-T30)
- Transponder and TCAS (W6-T32)
- GPWS and failure scenarios (W6-T33)
- Admin page for stations (W6-T34)

## Rules (unchanged)
- One task at a time. Each task gets tests (unit, plus browser checks for UI). Commit and push after every task.
- Formulas and test numbers come from `docs/agent/CONTRACTS.md`; progress is tracked in `docs/agent/PROGRESS.md`.
