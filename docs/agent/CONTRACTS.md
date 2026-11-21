# CONTRACTS: Source of Truth

Read **only the sections your task card lists**:
`sed -n '/^## §4 /,/^## §/p' docs/agent/CONTRACTS.md`

Every section is self-contained. The numbers under **Tests** are mandatory unit-test vectors.
Gains marked *(tunable)* may be changed if a test cannot pass. If you change one, update it here and note it in the handoff. Never change a test threshold.

---

## §1 Units, frame, constants

- **Local frame:** x is east and y is north, in **NM**. The origin is the **runway 09 threshold** of airport XTRN.
- **Bearings are true**, in degrees 0–360, measured clockwise from north. Magnetic variation is 0.
- Altitudes are **feet MSL**. AGL = `altFt - AIRPORT_ELEV_FT`. Terrain is flat at the airport elevation.

```ts
// shared/utils/units.ts
export const NM_TO_FT = 6076.12
export const NM_TO_M = 1852
export const KT_TO_MPS = 0.514444
export const KT_TO_FPM = 101.2687      // 1 kt = 101.2687 ft/min
export const G = 9.80665
export const AIRPORT_ELEV_FT = 900
export const deg2rad = (d: number) => d * Math.PI / 180
export const rad2deg = (r: number) => r * 180 / Math.PI
export const wrap360 = (a: number) => ((a % 360) + 360) % 360
export const wrap180 = (a: number) => wrap360(a + 180) - 180      // result in [-180, 180)
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
```

```ts
// shared/utils/geo.ts
export interface LatLon { lat: number; lon: number }
export interface Vec2 { x: number; y: number }
export const REF: LatLon = { lat: 13.0, lon: 77.6 }   // = runway 09 threshold
toLocal(p: LatLon, ref = REF): Vec2      // x = (lon-lon0)*60*cos(lat0), y = (lat-lat0)*60
toLatLon(v: Vec2, ref = REF): LatLon     // exact inverse
bearingDeg(from: Vec2, to: Vec2): number // wrap360(rad2deg(atan2(dx, dy)))
distNm(a: Vec2, b: Vec2): number         // hypot
```

```ts
// shared/utils/random.ts  (deterministic; used by tests and noise models)
mulberry32(seed: number): () => number   // uniform [0,1)
gaussian(rng: () => number): number      // Box-Muller, mean 0, sd 1
```

**Tests**
| ID | Input | Expected |
|---|---|---|
| U1 | wrap360(-90), wrap360(370) | 270, 10 |
| U2 | wrap180(190), wrap180(-190), wrap180(10) | -170, 170, 10 |
| G1 | toLocal({13.1, 77.6}) | x 0, y 6.000 (±0.001) |
| G2 | toLocal({13.0, 77.7}) | x 5.846 (±0.001), y 0 |
| G3 | toLatLon(toLocal(p)) for p = {13.05, 77.55} | p (±1e-9) |
| G4 | bearingDeg((0,0),(0,-10)), bearingDeg((0,0),(10,0)) | 180, 90 |
| G5 | distNm((0,0),(3,4)) | 5 |
| R1 | mulberry32(42) called twice with a fresh seed each time | identical sequences |

---

## §2 Shared types (`shared/types/index.ts`)

```ts
export interface AircraftState {
  x: number; y: number            // NM, local frame
  altFt: number                   // MSL
  hdgDeg: number                  // true heading
  iasKt: number                   // = TAS (no density model)
  pitchDeg: number; bankDeg: number
  vsFpm: number
  gsKt: number; trackDeg: number  // over the ground (after wind)
  throttle: number                // 0..1
  fuelPct: number                 // 0..100
  gearDown: boolean
  flapsDeg: 0 | 10 | 20 | 30
  onGround: boolean
}
export interface Controls { roll: number; pitch: number; throttle: number } // roll/pitch -1..1, throttle 0..1
export interface Wind { fromDeg: number; speedKt: number }

export type StationType =
  'VOR' | 'DVOR' | 'DME' | 'NDB' | 'ILS_LOC' | 'ILS_GS' | 'MARKER_OM' | 'MARKER_MM' | 'MARKER_IM'

export interface NavStation {          // client-side, after toLocal()
  id: number; type: StationType; ident: string; name: string
  frequency: number                    // MHz (VOR/DME/ILS/markers), kHz (NDB)
  x: number; y: number; rangeNm: number; runwayId: number | null
}
export interface RunwayInfo {
  id: number; ident: string; headingDeg: number
  x: number; y: number                 // threshold, local NM
  lengthM: number; widthM: number
}

export type ToFrom = 'TO' | 'FROM' | 'OFF'
export interface VorOutput { valid: boolean; ident: string; radialDeg: number; obsDeg: number; toFrom: ToFrom; cdiDevDeg: number; cdiFrac: number }
export interface DmeOutput { valid: boolean; distNm: number }
export interface AdfOutput { valid: boolean; ident: string; relBearingDeg: number; bearingToDeg: number }
export interface IlsOutput { locValid: boolean; locDevDeg: number; locFrac: number; gsValid: boolean; gsDevDeg: number; gsFrac: number }
export interface MarkerOutput { om: boolean; mm: boolean; im: boolean }
export interface NavOutputs {
  vor1: VorOutput; dme1: DmeOutput; adf: AdfOutput; ils: IlsOutput; markers: MarkerOutput
  raFt: number | null                  // radio altitude, null above 2500 ft AGL
}

export type FlightResult = 'IN_PROGRESS' | 'LANDED' | 'CRASHED' | 'COMPLETED' | 'ABORTED'

export type Objective =
  | { type: 'TRACK_RADIAL'; stationIdent: string; radialDeg: number; toFrom: 'TO' | 'FROM'; holdSec: number }
  | { type: 'REACH'; stationIdent: string; withinNm: number }
  | { type: 'LAND'; runwayIdent: string }
  | { type: 'ROUTE'; waypoints: string[] }

export type FailureType = 'VOR' | 'GPS' | 'ENGINE'
export interface ScenarioDTO {
  id: number; title: string; description: string; week: number
  startState: Partial<AircraftState>   // merged over DEFAULT_STATE (§3)
  target: Objective
  wind: Wind | null
  failures: { type: FailureType; atSec: number }[]
  traffic: { id: string; x: number; y: number; altFt: number; trackDeg: number; gsKt: number; vsFpm: number }[]
  radios: { nav1MHz?: number; adfKHz?: number; obsDeg?: number }
}

export interface FlightSampleInput {
  tMs: number; x: number; y: number; altFt: number; hdgDeg: number; iasKt: number; vsFpm: number
  nav: { cdiDevDeg?: number; locDevDeg?: number; locFrac?: number; gsDevDeg?: number; dmeNm?: number }
}
```

---

## §3 Flight model (`app/sim/flightModel.ts`, `app/sim/wind.ts`, `app/sim/loop.ts`)

```ts
export const DEFAULT_STATE: AircraftState = { x: -0.2, y: 0, altFt: 900, hdgDeg: 90, iasKt: 0, pitchDeg: 0,
  bankDeg: 0, vsFpm: 0, gsKt: 0, trackDeg: 90, throttle: 0, fuelPct: 100, gearDown: true, flapsDeg: 0, onGround: true }
step(s: AircraftState, c: Controls, wind: Wind | null, dt: number): AircraftState   // pure, returns a new object
```
Rules, applied in this order each step:
1. `bank += c.roll * 15 * dt`, clamped to ±35. `pitch += c.pitch * 5 * dt`, clamped to −15..+20. `throttle = c.throttle`.
2. Speed: `target = 140 * throttle`; `ias` moves toward the target by at most `3 * dt` kt; clamp `ias` to 0..200.
3. Turn: `hdg += rad2deg(G * tan(deg2rad(bank)) / max(ias*KT_TO_MPS, 1)) * dt`, then wrap360. No turning on the ground.
4. `vsFpm = ias * KT_TO_FPM * sin(deg2rad(pitch))`; `alt += vsFpm * dt / 60`.
5. Ground (`onGround`): bank is 0; pitch is clamped to ≥ 0, and pitch is 0 when `ias < 65`. Lift-off happens when `ias ≥ 65 && pitch > 0`, which sets `onGround = false`.
6. Touchdown: airborne and `alt ≤ AIRPORT_ELEV_FT` sets `alt = elev`, `onGround = true`, `vs = 0`. The landing judge (§7) checks this transition.
7. Wind (`wind.ts`): air velocity = ias along hdg. The wind vector points **toward** `fromDeg + 180`. Ground velocity = air + wind, which gives `gsKt` and `trackDeg`.
8. `x += gs·sin(track)·dt/3600`, `y += gs·cos(track)·dt/3600`.
9. `fuelPct -= 0.01 * throttle * dt` (minimum 0). When fuel is 0, the throttle is forced to 0.

`loop.ts`: a pure fixed-timestep helper.
`advance(acc: number, frameDtSec: number, stepDt = 1/60, maxSteps = 5): { steps: number; acc: number }`

**Tests**
| ID | Setup | Expected |
|---|---|---|
| F1 | airborne, hdg 90, ias 120, throttle 120/140, no wind, 60 s at dt 1/60 | Δx = 2.000 ±0.01, Δy ±0.01, Δalt ±1 |
| F2 | airborne, ias 100, bank 15, controls 0 | turn rate 2.93 ±0.05 °/s |
| F3 | airborne, ias 120, pitch 5 | vsFpm 1059 ±5 |
| F4 | hdg 0, ias 100, wind from 270 at 20 kt | trackDeg 11.31 ±0.1, gsKt 101.98 ±0.1 |
| F5 | onGround, ias 50, pitch input +1 for 2 s | still onGround, pitch 0 |
| F6 | roll input +1 for 5 s | bank 35 (clamped) |
| F7 | ias 50, throttle 0.5, 10 s | ias 70 ±0.1 |
| F8 | airborne at elev+5 ft, vs −300 | after a few steps: onGround true, alt 900 |
| L1 | advance(0, 0.05) | steps 3, acc ≈ 0 (±1e-9) |
| L2 | advance(0, 1.0) | steps 5 (capped) |

---

## §4 VOR, DVOR, DME, signal range (`app/nav/vor.ts`, `app/nav/dme.ts`, `app/nav/range.ts`)

```ts
inRange(st: NavStation, ac: AircraftState): boolean
  // dist ≤ min(st.rangeNm, losNm), where losNm = 1.23*sqrt(max(altFt - AIRPORT_ELEV_FT, 100))
radialDeg(st: Vec2, ac: Vec2, kind: 'VOR' | 'DVOR'): number
  // true = bearingDeg(station, aircraft); site error: VOR +1.5*sin(2θ), DVOR +0.3*sin(2θ); wrap360
cdi(radialDeg: number, obsDeg: number): { toFrom: ToFrom; cdiDevDeg: number; cdiFrac: number }
  // d = wrap180(obs - radial)
  // OFF if abs(abs(d) - 90) < 3  → dev 0
  // FROM if abs(d) < 90          → dev = d
  // TO otherwise                 → dev = -wrap180(d - 180)
  // cdiFrac = clamp(dev / 10, -1, 1). Positive = needle right = course is to the right.
vorReceive(stations, nav1MHz, obsDeg, ac): VorOutput
  // the station with type VOR|DVOR and frequency === nav1MHz (±0.001), inRange; otherwise valid false
dmeReceive(stations, nav1MHz, ac): DmeOutput
  // the DME paired on the same frequency; slant = sqrt(d² + ((alt - elev)/NM_TO_FT)²)
```
Below 20 kt groundspeed nothing changes. Failures: when a `VOR` failure is active, every output has `valid: false`.

**Tests**
| ID | Input | Expected |
|---|---|---|
| V1 | radialDeg((0,0),(0,-10),'DVOR') | 180 ±0.01 |
| V2 | radialDeg((0,0),(10,0),'DVOR') | 90 ±0.01 |
| V3 | true θ = 45: VOR, DVOR | 46.5, 45.3 (±0.01) |
| C1 | cdi(80, 90) | FROM, +10, frac +1 |
| C2 | cdi(85, 90) | FROM, +5, frac +0.5 |
| C3 | cdi(280, 90) | TO, +10 |
| C4 | cdi(265, 90) | TO, −5 |
| C5 | cdi(0, 90) | OFF |
| R1 | alt = elev+10000, LOS | 123.0 |
| R2 | station range 130, aircraft at 50 NM, alt = elev | out of range (LOS 12.3) |
| D1 | station (0,0), aircraft (3,0), alt = elev + 24304.48 | slant 5.000 ±0.001 |

---

## §5 ADF / NDB (`app/nav/adf.ts`)

```ts
adfReceive(stations, adfKHz, ac): AdfOutput
  // the NDB with that frequency, inRange; bearingTo = bearingDeg(ac, st); rel = wrap360(bearingTo - hdg)
```
**Tests**
| ID | Aircraft, heading, station (0,0) | relBearingDeg |
|---|---|---|
| A1 | (0,−10), hdg 0 | 0 |
| A2 | (0,−10), hdg 90 | 270 |
| A3 | (10,0), hdg 0 | 270 |
| A4 | (10,0), hdg 270 | 0 |

---

## §6 ILS, markers, radio altimeter (`app/nav/ils.ts`, `app/nav/markers.ts`, `app/nav/radioAlt.ts`)

```ts
ilsReceive(stations, runway: RunwayInfo, navMHz, ac): IlsOutput
  // LOC: station ILS_LOC with that freq. b = bearingDeg(loc, ac); recip = wrap360(runway.headingDeg + 180)
  //   locDevDeg = wrap180(b - recip)   (positive = fly right)
  //   locValid = inRange && abs(locDevDeg) ≤ 35
  //   locFrac = clamp(locDevDeg / 2.5, -1, 1)
  // GS: station ILS_GS with the same freq. distFt = distNm(gs, ac)*NM_TO_FT
  //   angle = rad2deg(atan2(alt - elev, distFt)); gsDevDeg = 3.0 - angle  (positive = fly up)
  //   gsValid = locValid && distNm ≤ st.rangeNm; gsFrac = clamp(gsDevDeg / 0.7, -1, 1)
markersReceive(stations, ac): MarkerOutput
  // active if dist ≤ max(0.05, 0.7 * (alt - elev)/NM_TO_FT)
radioAltFt(ac): number | null           // alt - elev, or null if > 2500
callouts(prevRa: number | null, ra: number | null): number[]
  // each of [1000, 500, 100, 50] with prevRa > c ≥ ra
```
**Tests** (for the LOC tests, use a LOC antenna at (0,0), runway hdg 90, range 25; for the GS tests, a GS antenna at (0,0), range 10)
| ID | Aircraft | Expected |
|---|---|---|
| I1 | (−10, 0.17455) | locDevDeg +1.00 ±0.01, locFrac +0.40 |
| I2 | (−10, −0.17455) | −1.00, −0.40 |
| I3 | (−10, 1) | locFrac +1 (clamped) |
| I4 | (5, 3) | locValid false |
| S1 | (−3, 0), alt elev+955.31 | gsDevDeg 0.00 ±0.01 |
| S2 | (−3, 0), alt elev+1500 | gsDevDeg −1.70 ±0.01, gsFrac −1 |
| S3 | (−3, 0), alt elev+800 | gsDevDeg +0.49 ±0.01, gsFrac +0.70 ±0.01 |
| M1 | exactly over OM, 1500 AGL | om true |
| M2 | 0.5 NM before OM, 1500 AGL | om false |
| RA1 | alt elev+3000 | null; alt elev+400 → 400 |
| CO1 | callouts(1020, 980) | [1000] |
| CO2 | callouts(520, 40) | [500, 100, 50] |

---

## §7 Landing, objectives, scoring (`app/sim/landing.ts`, `app/sim/objectives.ts`, `server/services/scoring.logic.ts`)

```ts
judgeTouchdown(ac: AircraftState, rwy: RunwayInfo):
  { result: 'LANDED' | 'CRASHED'; lateralM: number; alongM: number; vsFpm: number; reasons: string[] }
  // u = unit vector along the runway heading; r = (ac - threshold) in metres
  // alongM = r·u; lateralM = cross so that positive = right of centreline
  // LANDED only if: |lateral| ≤ widthM/2, 0 ≤ along ≤ lengthM, |vs| ≤ 900, |bank| ≤ 10, gearDown
  // judge with the vs/bank from the step BEFORE touchdown (pass the pre-touchdown state)
evaluateObjective(obj, ctx, prog: { heldSec: number }, dt): { done: boolean; prog: { heldSec: number } }
  // TRACK_RADIAL: if vor valid && ident matches && toFrom matches && |cdiDevDeg| < 2 → heldSec += dt, else 0; done when ≥ holdSec
  //   (the radial is checked by setting OBS = radialDeg in the scenario radios)
  // REACH: done when distNm(ac, station) ≤ withinNm
  // ROUTE: done when ctx.fmsComplete
  // LAND: never done here (the touchdown judge decides)
score(result, landing?: { lateralM: number; vsFpm: number; meanAbsLocFrac: number }): { total: number; details: Record<string, number> }
  // CRASHED/ABORTED → 0. COMPLETED (non-landing) → 100.
  // LANDED: centre = 40*max(0, 1 - |lateralM|/80)
  //         touch  = 30 if |vs| ≤ 300; 0 if ≥ 900; linear between
  //         track  = 30*(1 - min(1, meanAbsLocFrac))   (samples within 4 NM of the threshold)
  //         total  = round(centre + touch + track)
```
**Tests** (runway: threshold (0,0), hdg 90, 3000 m × 45 m)
| ID | Case | Expected |
|---|---|---|
| T1 | x 0.2, y −10/1852, vs −400, bank 2, gear down | LANDED, lateralM +10 ±0.1, alongM 370.4 ±0.5 |
| T2 | same, gear up | CRASHED |
| T3 | y = 30/1852 | CRASHED |
| T4 | vs −1000 | CRASHED |
| T5 | x −0.1 | CRASHED |
| O1 | TRACK_RADIAL holdSec 60: 61 × 1 s with dev 1 | done |
| O2 | 30 s good, 1 s bad, 30 s good | not done (heldSec 30) |
| S1 | LANDED lateral 20, vs −600, loc 0.2 | 69 |
| S2 | LANDED lateral 0, vs −200, loc 0 | 100 |
| S3 | CRASHED | 0 |

---

## §8 Autopilot (`app/systems/autopilot.ts`)

```ts
export interface ApState {
  lateral: 'OFF' | 'HDG' | 'NAV' | 'APP' | 'LNAV'
  vertical: 'OFF' | 'ALT' | 'VS' | 'GS'
  hdgDeg: number; altFt: number; vsFpm: number
  navCaptured: boolean; gsCaptured: boolean
}
apStep(ap: ApState, ac: AircraftState, nav: NavOutputs, ctx: { obsDeg: number; rwyHdgDeg: number; lnavHdgDeg: number | null }):
  { ap: ApState; roll: number; pitch: number }   // throttle is untouched (no autothrottle)
```
Gains are *(tunable)*:
- Inner loops: `roll = clamp((bankCmd - bank)/10, -1, 1)`, `pitch = clamp((pitchCmd - pitch)/5, -1, 1)`.
- `hdgToBank(h) = clamp(2 * wrap180(h - hdg), -25, 25)`.
- HDG: `bankCmd = hdgToBank(ap.hdgDeg)`.
- NAV: captured when `vor1.valid && |cdiFrac| < 0.9`; before capture fly HDG. Then `h = obs + clamp(4 * cdiDevDeg, -30, 30)`.
- APP: LOC captured when `locValid && |locFrac| < 0.9`, then `h = rwyHdg + clamp(12 * locDevDeg, -30, 30)`. GS is captured when `gsValid && |gsDevDeg| < 0.15` and switches the vertical mode to GS.
- LNAV: `h = lnavHdgDeg` (§10).
- Vertical: ALT `vsCmd = clamp(4*(altFt - alt), -1500, 1500)`; VS `vsCmd = ap.vsFpm`, which switches to ALT when `|altFt - alt| < 200`. GS: `vsCmd = -gs*KT_TO_FPM*tan(3°) + 400*gsDevDeg`.
- `pitchCmd = rad2deg(asin(clamp(vsCmd / (ias*KT_TO_FPM), -1, 1)))`.

**Tests**: closed loop with §3 `step`, dt 1/20, no wind, ias 120, throttle 120/140
| ID | Setup | Expected |
|---|---|---|
| AP1 | HDG 0→90, alt elev+3000 | after 60 s: |hdg−90| < 2, |bank| < 3 |
| AP2 | ALT 3000→4000 | after 120 s: |alt−4000| < 50 |
| AP3 | APP, seed ILS (§14), start (−12, 1.0), hdg 120, alt elev+2500, ALT hold | after 240 s: locValid, |locDevDeg| < 0.25 |
| AP4 | APP, start (−8, 0), hdg 90, alt elev+2000 | GS captured; when x ≥ −2: |gsDevDeg| < 0.2 |

---

## §9 Alerts, GPWS, TCAS, transponder (`app/systems/alerts.ts`, `gpws.ts`, `tcas.ts`, `transponder.ts`)

```ts
gpws(raFt: number | null, vsFpm: number, gearDown: boolean, onGround: boolean): 'PULL UP' | 'SINK RATE' | 'TOO LOW GEAR' | null
  // onGround or ra null → null
  // ra<2500 && vs<-3500 → PULL UP; ra<2500 && vs<-2500 → SINK RATE; ra<500 && !gearDown → TOO LOW GEAR
tcas(own: AircraftState, intruders: Intruder[]): { id: string; level: 'NONE'|'PROXIMATE'|'TA'|'RA'; sense?: 'CLIMB'|'DESCEND'; rangeNm: number; dAltFt: number }[]
  // relPos = intruder - own; relVel = vI - vOwn (kt, from track/gs)
  // closure = -(relPos·relVel)/range; tau = closure > 0 ? range/closure*3600 : Infinity
  // RA: tau<25 && |dAlt|<600; TA: tau<40 && |dAlt|<850; PROXIMATE: range<6 && |dAlt|<1200
  // RA sense: intruder alt > own → DESCEND, else CLIMB
moveIntruder(i: Intruder, dt): Intruder  // straight line, constant vs
alerts(ac, ctx: { raFt; gpws; tcasRA: boolean; navFail: boolean }): { warnings: string[]; cautions: string[] }
  // WARN: STALL (airborne && ias<55), OVERSPEED (ias>180), PULL UP (gpws), TCAS RA
  // CAUTION: GEAR (airborne && !gearDown && ra!==null && ra<1000 && vs<0), LOW FUEL (<10), NAV FAIL
validSquawk(code: string): boolean       // /^[0-7]{4}$/
modeCAltFt(altFt): number                // round(alt/100)*100
identActive(identPressedMs: number | null, nowMs: number): boolean   // true for 18 s
```
**Tests**
| ID | Case | Expected |
|---|---|---|
| GP1 | ra 2000, vs −3000 | SINK RATE |
| GP2 | ra 2000, vs −4000 | PULL UP |
| GP3 | ra null, vs −4000 | null |
| GP4 | ra 400, vs −500, gear up | TOO LOW GEAR |
| TC1 | own (0,0) hdg 0 gs 200; intruder (0,5) track 180 gs 200, same alt | PROXIMATE (tau 45) |
| TC2 | intruder at (0,4) | TA (tau 36) |
| TC3 | intruder at (0,2.5) | RA, sense CLIMB |
| TC4 | (0,2.5), intruder +1000 ft | PROXIMATE |
| TC5 | (0,2), intruder track 0 gs 200 (same direction) | PROXIMATE (tau ∞) |
| AL1 | airborne ias 50 | warnings include STALL |
| AL2 | ias 185 | OVERSPEED |
| AL3 | on ground ias 0 | no warnings |
| AL4 | gear up, ra 800, vs −500 | cautions include GEAR |
| XP1 | validSquawk('7700'), ('7800'), ('123') | true, false, false |
| XP2 | modeCAltFt(3449) | 3400 |

---

## §10 INS, GPS, blend, FMS (`app/nav/ins.ts`, `gps.ts`, `blend.ts`, `fms.ts`)

INS and GPS work in **metres** in the local frame. Convert to NM for display.
```ts
insInit(trueX_m, trueY_m, vx, vy, opts?: { bias?: [number, number]; sigma?: number }): InsState
  // default bias [0.002, -0.0015] m/s², sigma 0.001
insStep(s: InsState, trueVx: number, trueVy: number, dt: number, rng: () => number): InsState
  // trueAccel = (v - prevV)/dt; meas = trueAccel + bias + sigma*gaussian(rng)
  // vIns += meas*dt; pIns += vIns*dt
gpsFix(trueX_m, trueY_m, rng, opts: { sigmaM?: number /*5*/; outage: boolean }): { x: number; y: number } | null
blendStep(corr: [number, number], ins: [number, number], gps: [number, number] | null, k = 0.3): [number, number]
  // if gps: corr += k*((gps - ins) - corr). Displayed position = ins + corr. GPS updates at 1 Hz.
fmsInit(wps: Vec2[]): FmsState               // legs between consecutive waypoints; activeLeg 0
fmsStep(f: FmsState, ac: Vec2): { f: FmsState; xteNm: number; legCourseDeg: number; lnavHdgDeg: number | null; complete: boolean }
  // d = unit(b-a); r = ac - a; xte = d.y*r.x - d.x*r.y (positive = right of course)
  // remaining = |b-a| - r·d; when remaining < 0.5 → activeLeg++
  // lnavHdg = wrap360(legCourse - clamp(30*xte, -30, 30)); complete when activeLeg === legs.length (lnavHdg null)
```
**Tests**
| ID | Case | Expected |
|---|---|---|
| IN1 | stationary truth, bias [0.01,0], sigma 0, dt 0.01, 100 s | x error 50 ±0.6 m |
| IN2 | truth 60 m/s east, bias 0, sigma 0, 100 s | error < 0.01 m |
| GS1 | mulberry32(42), 1000 fixes at (0,0), σ 5 | |mean x| < 0.5, sd 4.5–5.5 |
| GS2 | outage true | null |
| BL1 | IN1 setup for 300 s, perfect GPS at 1 Hz, k 0.3 | raw INS error > 400 m, blended < 15 m |
| FM1 | leg (0,0)→(0,10), ac (1,5) | xte +1, course 0, lnavHdg 330 |
| FM2 | ac (0,9.6) | activeLeg becomes 1 |
| FM3 | after the last leg | complete true, lnavHdg null |

---

## §11 Instrument mapping (`app/components/instruments/gauges.ts`)

Pure helpers used by the canvas components. Angles are clockwise from 12 o'clock unless noted.
```ts
airspeedNeedleDeg(ias) = clamp(ias, 0, 200) / 200 * 320
altHands(alt) = { hundredsDeg: (alt % 1000)/1000*360, thousandsDeg: (alt % 10000)/10000*360 }
vsiNeedleDeg(vs) = clamp(vs, -2000, 2000) / 2000 * 160      // 0 = 9 o'clock, + = up
attitudeOffsetPx(pitchDeg, pxPerDeg = 4) = pitchDeg * pxPerDeg  // horizon rotated by -bank
headingCardRotation(hdg) = -hdg
cdiNeedlePx(frac, halfWidthPx) = frac * halfWidthPx
```
**Tests:** airspeed 100 → 160. alt 3450 → hundreds 162, thousands 124.2. vsi 1000 → 80, vsi −3000 → −160.

---

## §12 Database (`prisma/schema.prisma`)

This replaces the schema in FLIGHT_SIM_PLAN.md. Use Prisma **6**.
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"  url = env("DATABASE_URL") }

enum Role { STUDENT ADMIN }
enum StationType { VOR DVOR DME NDB ILS_LOC ILS_GS MARKER_OM MARKER_MM MARKER_IM }
enum FlightResult { IN_PROGRESS LANDED CRASHED COMPLETED ABORTED }

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(STUDENT)
  flights      Flight[]
  createdAt    DateTime @default(now())
}
model Airport {
  id Int @id @default(autoincrement())
  icao String @unique
  name String
  lat Float
  lon Float
  elevationFt Int
  runways Runway[]
}
model Runway {
  id Int @id @default(autoincrement())
  airport Airport @relation(fields: [airportId], references: [id])
  airportId Int
  ident String
  headingDeg Float
  thresholdLat Float
  thresholdLon Float
  lengthM Int
  widthM Int
  stations NavStation[]
}
model NavStation {
  id Int @id @default(autoincrement())
  type StationType
  ident String
  name String
  frequency Float
  lat Float
  lon Float
  rangeNm Int
  runway Runway? @relation(fields: [runwayId], references: [id])
  runwayId Int?
  @@index([frequency])
}
model Waypoint {
  id Int @id @default(autoincrement())
  ident String @unique
  lat Float
  lon Float
}
model Scenario {
  id Int @id @default(autoincrement())
  title String
  description String
  week Int
  config Json            // { startState, target, wind, failures, traffic, radios }; see §2 ScenarioDTO
  flights Flight[]
}
model Flight {
  id String @id @default(uuid())
  user User @relation(fields: [userId], references: [id])
  userId String
  scenario Scenario @relation(fields: [scenarioId], references: [id])
  scenarioId Int
  startedAt DateTime @default(now())
  endedAt DateTime?
  result FlightResult @default(IN_PROGRESS)
  samples FlightSample[]
  score Score?
  @@index([userId])
}
model FlightSample {
  id Int @id @default(autoincrement())   // Int, not BigInt (JSON-safe)
  flight Flight @relation(fields: [flightId], references: [id], onDelete: Cascade)
  flightId String
  tMs Int
  x Float
  y Float
  altFt Float
  hdgDeg Float
  iasKt Float
  vsFpm Float
  nav Json
  @@index([flightId, tMs])
}
model Score {
  id Int @id @default(autoincrement())
  flight Flight @relation(fields: [flightId], references: [id], onDelete: Cascade)
  flightId String @unique
  total Int
  details Json
}
```

---

## §13 API (Nuxt server routes, all JSON)

Auth uses **nuxt-auth-utils**: the session holds `user: { id, name, email, role }`. Passwords are hashed with **bcryptjs** (cost 10), so the seed script can create users outside Nuxt.
Bodies are validated with Zod via `readValidatedBody(event, schema.parse)`. A failed validation returns 400.

| Method | Route | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/health` | – | – | `{ ok: true, db: boolean }` |
| POST | `/api/auth/register` | – | `{ name (1-80), email, password (min 8) }` | 201 `{ user }`; 409 if the email exists |
| POST | `/api/auth/login` | – | `{ email, password }` | `{ user }`; 401 |
| POST | `/api/auth/logout` | – | – | `{ ok: true }` |
| GET | `/api/auth/me` | user | – | `{ user }`; 401 |
| GET | `/api/airports` | – | – | `[{ id, icao, name, lat, lon, elevationFt, runways: [{ id, ident, headingDeg, thresholdLat, thresholdLon, lengthM, widthM }] }]` |
| GET | `/api/stations?type=` | – | – | `[{ id, type, ident, name, frequency, lat, lon, rangeNm, runwayId }]` |
| POST | `/api/stations` | admin | the station fields | 201 station |
| PUT | `/api/stations/:id` | admin | partial station | station |
| DELETE | `/api/stations/:id` | admin | – | `{ ok: true }` |
| GET | `/api/waypoints` | – | – | `[{ id, ident, lat, lon }]` |
| GET | `/api/scenarios` | – | – | `[{ id, title, description, week }]` ordered by week, id |
| GET | `/api/scenarios/:id` | – | – | `ScenarioDTO` (§2) |
| POST | `/api/flights` | user | `{ scenarioId }` | 201 `{ id }` |
| POST | `/api/flights/:id/samples` | owner | `{ samples: FlightSampleInput[1..100] }` | `{ count }`; 403 if not the owner; 409 if the flight has ended |
| PATCH | `/api/flights/:id/end` | owner | `{ result: 'LANDED'\|'CRASHED'\|'COMPLETED'\|'ABORTED', landing?: { lateralM, vsFpm } }` | `{ flight, score }`; the server computes meanAbsLocFrac from the samples |
| GET | `/api/flights` | user | `?all=1` (admin only) | `[{ id, scenarioTitle, startedAt, endedAt, result, score }]` newest first |
| GET | `/api/flights/:id` | owner or admin | – | `{ flight, scenario, samples, score }` |

Server files: `server/api/<path>.<method>.ts`. Services: `server/services/<name>.ts` (DB) and `<name>.logic.ts` (pure). Shared guards in `server/utils/auth.ts`: `requireUser(event)` and `requireAdmin(event)`.

---

## §14 Seed data (`prisma/seed.ts`)

Define the positions in **local NM** and convert them with `toLatLon` from `shared/utils/geo.ts`. The seed must be idempotent: delete all rows, then insert.

**Airport:** `XTRN`, "SkyNav Training Field", position REF (13.0, 77.6), elevation 900 ft.
**Runway:** `09`, heading 90, threshold (0,0), 3000 m × 45 m.

| type | ident | name | freq | local (x, y) | rangeNm | runway |
|---|---|---|---|---|---|---|
| VOR | TRN | Trainer VOR | 113.50 | (2, 6) | 130 | – |
| DME | TRN | Trainer DME | 113.50 | (2, 6) | 130 | – |
| DVOR | ALF | Alpha DVOR | 116.20 | (−40, 25) | 130 | – |
| DME | ALF | Alpha DME | 116.20 | (−40, 25) | 130 | – |
| NDB | NB | November NDB | 350 (kHz) | (−25, −12) | 50 | – |
| ILS_LOC | ITRN | ILS 09 LOC | 110.30 | (1.80, 0) | 25 | 09 |
| ILS_GS | ITRN | ILS 09 GS | 110.30 | (0.16, −0.08) | 10 | 09 |
| MARKER_OM | OM | Outer Marker | 75.0 | (−4.5, 0) | 1 | 09 |
| MARKER_MM | MM | Middle Marker | 75.0 | (−0.6, 0) | 1 | 09 |
| MARKER_IM | IM | Inner Marker | 75.0 | (−0.15, 0) | 1 | 09 |

**Waypoints:** WP1 (−30, 0), WP2 (−30, 20), WP3 (−10, 20).

**Users:** `admin@skynav.local` / `admin1234` (ADMIN), `student@skynav.local` / `student1234` (STUDENT).

**Scenarios** (config follows §2; unspecified state fields use DEFAULT_STATE):
| week | title | startState | target | extras |
|---|---|---|---|---|
| 1 | Free flight | DEFAULT_STATE (on the runway) | LAND 09 | radios nav1 113.50 |
| 1 | VOR radial tracking | (−15, −5), alt 3900, hdg 60, ias 120, airborne, throttle 0.857 | TRACK_RADIAL TRN 270 TO, hold 60 | nav1 113.50, obs 90 |
| 2 | VOR to VOR | (5, 10), alt 4900, hdg 300, ias 120, airborne | REACH ALF ≤ 1 | nav1 116.20 |
| 2 | NDB homing | (0, 10), alt 3900, hdg 180, ias 120, airborne | REACH NB ≤ 0.5 | adf 350; wind 270/15 |
| 3 | ILS approach 09 | (−12, 1.0), alt 3400, hdg 120, ias 120, airborne, flaps 10 | LAND 09 | nav1 110.30 |
| 4 | Autopilot coupled ILS | as above | LAND 09 | nav1 110.30 |
| 5 | FMS route | (−25, −5), alt 4900, hdg 0, ias 120, airborne | ROUTE WP1, WP2, WP3 | – |
| 6 | TCAS encounter | (−20, 0), alt 4900, hdg 90, ias 120, airborne | REACH TRN ≤ 1 | traffic: T1 at (0, 0), alt 4900, track 270, gs 150 |
| 6 | GPS + VOR failure | FMS route start | ROUTE WP1, WP2, WP3 | failures: GPS at 60 s, VOR at 120 s |
