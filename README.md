# SkyNav Sim: Avionics Navigation Flight Simulator

A web-based flight simulator for learning aircraft navigation systems. It is a single full-stack application built with **Nuxt 4 (Vue 3)**, **PostgreSQL** and **Prisma**.

**Quick start (Docker):** `docker compose up -d --build`, then `docker compose run --rm app node scripts/data/download.mjs` and `docker compose run --rm app npx prisma db seed`, then open http://localhost:3000 · **Full setup: [SETUP.md](SETUP.md)** · **Roadmap: [docs/PLAN.md](docs/PLAN.md)**

## Features
- **One-screen cockpit:**
  - airspeed, attitude, altimeter, VSI and heading gauges
  - VOR/CDI, RMI and ADF indicators, plus a DME readout
  - NAV and ADF radios
  - ISA air-data panel with baro setting
  - a CVOR/DVOR teaching diagram
  - on-screen and keyboard flight controls
- **Real data:** 48,000 airports, runways and nav aids worldwide from [OurAirports](https://ourairports.com/data/) (public domain), on an [OpenStreetMap](https://www.openstreetmap.org/) moving map. India only by default, with a whole-world toggle and per-layer legend toggles.
- **Journey autopilot:** pick any two airports. The aircraft takes off, climbs, cruises, descends, captures the runway centreline, flies a 3° glide path, flares, lands and stops. You can watch the stick, rudder and throttle move, adjust the cruise speed and speed up time (up to 64×).
- **Physics:**
  - point-mass flight model with jet (350 kt) and trainer (140 kt) profiles
  - International Standard Atmosphere for all air data (IAS→TAS, Mach, OAT, density and pressure altitude, QNH)
  - wind
  - a local frame that re-centres every 40 NM, so it works anywhere on Earth
- **Nav receivers:** VOR (with CVOR/DVOR site error), DME slant range, ADF, line-of-sight range and nearest-station selection.
- **Test mode:** graded scenarios (VOR tracking, NDB homing, ILS approaches…) with login, saved flights, scores and a flight log.
- **Explain mode:** triple-tap any panel for an explanation of how it works.
- **ILS:** localiser, glide slope, marker beacons, radio altimeter with callouts, and an HSI that switches automatically between VOR and ILS.
- **Autopilot (MCP):** HDG, NAV (VOR), APP (coupled ILS), ALT, V/S and A/THR, with a flight-mode annunciator.
- **Glass cockpit:** PFD and ND (switchable with the classic gauges).
- **INS / GPS:** inertial drift, GPS fixes and outages, INS+GPS blending, shown on the map.
- **Test mode:** each test starts on runway 09L at zero; the touchdown is judged and scored, and every flight is recorded for a replay page with graphs.

## Tech stack
| Layer | Choice |
|---|---|
| App | Nuxt 4 (Vue 3 + Nitro server routes), TypeScript, Pinia, Tailwind CSS |
| Map | Leaflet + OpenStreetMap tiles |
| Database | PostgreSQL 17 (Docker) + Prisma 6 |
| Auth | nuxt-auth-utils (sealed cookie session) + bcryptjs |
| Validation | Zod |
| Tests | Vitest (unit + DB integration), API smoke script, Playwright-core browser test |

## Project layout
```
app/
  sim/          flight model, ISA-based engine, autopilot (autoflight.ts), aircraft profiles, presets
  nav/          VOR, DME, ADF receivers, signal range
  components/   instruments (canvas), radios, views (map, cockpit, journey, explanations)
  pages/        cockpit, scenarios (Test mode), fly/[id], flights, login/register
server/         API routes (airports, stations, scenarios, flights, auth) + services
shared/         types, units, geo, ISA atmosphere, RNG
prisma/         schema, migrations, seed (VOBL + OurAirports world import)
tests/          unit, int (database), e2e (browser)
docs/agent/     plan, contracts (formulas + test vectors), progress log
```

## Data and limits
- The ILS installations at Bengaluru (09L IBLA 110.30, 09R IBLB 109.90) are **training placements**, not published procedures. **Not for real-world navigation.**
- Terrain is flat at the elevation of the nearest airport.
- Map © OpenStreetMap contributors · Airport/nav-aid data: OurAirports (public domain).
