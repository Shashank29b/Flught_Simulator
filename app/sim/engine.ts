import { AIRPORT_ELEV_FT, NM_TO_M } from '#shared/utils/units'
import { mulberry32 } from '#shared/utils/random'
import { REF, distNm, toLatLon, toLocal, type LatLon } from '#shared/utils/geo'
import type { AirportInfo, AircraftState, Atmosphere, Controls, FlightResult, NavOutputs, NavStation, Objective, RunwayInfo, Wind } from '#shared/types'
import { evaluateObjective, type ObjProgress } from './objectives'
import { autoflightStep, journeyGroundElev, type AutoState, type Journey } from './autoflight'
import { JET, type AircraftProfile } from './aircraft'
import { judgeTouchdown, type Touchdown } from './landing'
import { apStep, type ApState } from '../systems/autopilot'
import { tunedLocaliser, ilsReceive } from '../nav/ils'
import { insInit, insStep, type InsState } from '../nav/ins'
import { gpsFix } from '../nav/gps'
import { blendStep } from '../nav/blend'
import { DEFAULT_STATE, step } from './flightModel'
import { vorReceive } from '../nav/vor'
import { dmeReceive } from '../nav/dme'
import { adfReceive } from '../nav/adf'
import { markersReceive } from '../nav/markers'
import { radioAltFt } from '../nav/radioAlt'

export interface Radios { nav1MHz: number; obsDeg: number; adfKHz: number; baroHpa: number }

export interface World {
  ac: AircraftState
  simMs: number
  /** Local-frame origin (re-centred as the aircraft moves, see rebaseWorld). */
  ref: LatLon
  /** Terrain height under the aircraft: elevation of the nearest airport (flat-terrain model). */
  groundElevFt: number
  airports: AirportInfo[]
  wind: Wind | null
  atmo: Atmosphere
  stations: NavStation[]
  runways: RunwayInfo[]
  radios: Radios
  nav: Partial<NavOutputs>
  objective: Objective | null
  objProgress: ObjProgress
  done: { result: FlightResult; landing?: { lateralM: number; vsFpm: number }; reasons?: string[] } | null
  fmsComplete: boolean
  /** Automatic journey (auto take-off → landing); null when flying manually. */
  journey: Journey | null
  auto: AutoState | null
  /** The controls applied in the last step (shown on the yoke/throttle display). */
  lastControls: Controls
  profile: AircraftProfile
  /** Last touchdown result (shown in the cockpit; ends the flight in Test mode). */
  lastTouchdown: Touchdown | null
  /** Mode autopilot (MCP). The journey autopilot, when active, takes precedence. */
  ap: ApState | null
  /** INS error state, GPS measurement error and the blended estimate of the INS error (metres). */
  insgps: InsGps
}

export interface InsGps { ins: InsState; est: [number, number]; gps: [number, number] | null; outage: boolean; seed: number; nextFixMs: number }

/** Sensor quality chosen so the drift is visible within minutes (≈ 1 km after 10 min). */
export function newInsGps(seed = 42): InsGps {
  return { ins: insInit({ bias: [0.004, -0.003], sigma: 0.002 }), est: [0, 0], gps: null, outage: false, seed, nextFixMs: 1000 }
}

/** True, INS, GPS and blended positions in the local frame (NM). */
export function navPositions(w: World): { truth: { x: number; y: number }; ins: { x: number; y: number }; gps: { x: number; y: number } | null; blend: { x: number; y: number } } {
  const g = w.insgps
  const at = (ex: number, ey: number) => ({ x: w.ac.x + ex / NM_TO_M, y: w.ac.y + ey / NM_TO_M })
  return {
    truth: { x: w.ac.x, y: w.ac.y },
    ins: at(g.ins.errX, g.ins.errY),
    gps: g.gps ? at(g.gps[0], g.gps[1]) : null,
    blend: at(g.ins.errX - g.est[0], g.ins.errY - g.est[1]),
  }
}

function stepInsGps(g: InsGps, simMs: number, dt: number): InsGps {
  const rng = mulberry32(g.seed)
  const ins = insStep(g.ins, dt, rng)
  let { est, gps, nextFixMs } = g
  if (simMs >= nextFixMs) {
    gps = gpsFix(rng, { outage: g.outage })
    est = blendStep(est, [ins.errX, ins.errY], gps)
    nextFixMs = simMs + 1000
  }
  return { ...g, ins, est, gps, nextFixMs, seed: Math.floor(rng() * 4294967296) }
}

export const DEFAULT_RADIOS: Radios = { nav1MHz: 113.5, obsDeg: 90, adfKHz: 350, baroHpa: 1013.25 }

export function createWorld(init: Partial<Omit<World, 'ac' | 'radios'>> & { ac?: Partial<AircraftState>; radios?: Partial<Radios> } = {}): World {
  return {
    ac: { ...DEFAULT_STATE, ...(init.ac ?? {}) },
    simMs: init.simMs ?? 0,
    ref: init.ref ?? REF,
    groundElevFt: init.groundElevFt ?? AIRPORT_ELEV_FT,
    airports: init.airports ?? [],
    wind: init.wind ?? null,
    atmo: init.atmo ?? { qnhHpa: 1013.25, isaDevC: 0 },
    stations: init.stations ?? [],
    runways: init.runways ?? [],
    radios: { ...DEFAULT_RADIOS, ...(init.radios ?? {}) },
    nav: init.nav ?? {},
    objective: init.objective ?? null,
    objProgress: init.objProgress ?? { heldSec: 0 },
    done: init.done ?? null,
    fmsComplete: init.fmsComplete ?? false,
    journey: init.journey ?? null,
    auto: init.auto ?? null,
    lastControls: init.lastControls ?? { roll: 0, pitch: 0, throttle: 0 },
    profile: init.profile ?? JET,
    lastTouchdown: init.lastTouchdown ?? null,
    ap: init.ap ?? null,
    insgps: init.insgps ?? newInsGps(),
  }
}

/** Advances the whole simulated world by dt seconds. Pure. */
export function simStep(w: World, c: Controls, dt: number): World {
  if (w.done) return w
  let controls = c
  let ac0 = w.ac
  let auto = w.auto
  let groundElevFt = w.groundElevFt
  if (w.journey && auto) {
    groundElevFt = journeyGroundElev(w.journey, ac0, w.ref, groundElevFt)
    const o = autoflightStep(w.journey, auto, ac0, w.ref, groundElevFt, w.profile)
    auto = o.auto
    controls = o.controls
    ac0 = { ...ac0, gearDown: o.gearDown, flapsDeg: o.flapsDeg }
  }
  let ap = w.ap
  if (!(w.journey && auto) && ap?.engaged) {
    const tuned = tunedLocaliser(w.stations, w.runways, w.radios.nav1MHz, ac0)
    const o = apStep(ap, ac0, w.nav, { obsDeg: w.radios.obsDeg, rwyHdgDeg: tuned?.runway.headingDeg ?? null }, w.profile)
    ap = o.ap
    controls = { roll: o.roll, pitch: o.pitch, yaw: c.yaw ?? 0, throttle: o.throttle ?? c.throttle }
  }
  const ac = step(ac0, controls, w.wind, dt, w.atmo, groundElevFt, w.profile)
  const r = w.radios
  const nav: Partial<NavOutputs> = {
    ...w.nav,
    vor1: vorReceive(w.stations, r.nav1MHz, r.obsDeg, ac, groundElevFt),
    dme1: dmeReceive(w.stations, r.nav1MHz, ac, groundElevFt),
    adf: adfReceive(w.stations, r.adfKHz, ac, groundElevFt),
    ils: ilsReceive(w.stations, w.runways, r.nav1MHz, ac, groundElevFt),
    markers: markersReceive(w.stations, ac, groundElevFt),
    raFt: radioAltFt(ac, groundElevFt),
  }
  let next: World = { ...w, ac, nav, auto, ap, insgps: stepInsGps(w.insgps, w.simMs + dt * 1000, dt), groundElevFt, lastControls: controls, simMs: w.simMs + dt * 1000 }
  if (!w.ac.onGround && ac.onGround) {
    const td = judgeTouchdown(ac0, ac, w.runways)
    next = { ...next, lastTouchdown: td }
    // Test mode: a touchdown ends the flight (landing objective → LANDED/CRASHED; any other objective → crash only)
    if (w.objective && (w.objective.type === 'LAND' || td.result === 'CRASHED')) {
      next = { ...next, done: { result: td.result, landing: { lateralM: td.lateralM, vsFpm: td.vsFpm }, reasons: td.reasons } }
    }
  }
  next = applyObjective(next, dt)
  return next
}

function applyObjective(w: World, dt: number): World {
  if (!w.objective) return w
  const r = evaluateObjective(w.objective, { ac: w.ac, vor1: w.nav.vor1, stations: w.stations, fmsComplete: w.fmsComplete }, w.objProgress, dt)
  return { ...w, objProgress: r.prog, done: r.done ? { result: 'COMPLETED' } : w.done }
}

/** Distance from the frame origin beyond which the world is re-centred (keeps the flat-earth error tiny). */
export const REBASE_NM = 40

const move = <T extends { x: number; y: number }>(p: T, from: LatLon, to: LatLon): T => ({ ...p, ...toLocal(toLatLon(p, from), to) })

/** Re-centres the local frame on a new origin. All positions keep their lat/lon. Pure. */
export function rebaseWorld(w: World, newRef: LatLon): World {
  return {
    ...w,
    ref: newRef,
    ac: move(w.ac, w.ref, newRef),
    stations: w.stations.map(s => move(s, w.ref, newRef)),
    runways: w.runways.map(r => move(r, w.ref, newRef)),
    airports: w.airports.map(a => move(a, w.ref, newRef)),
  }
}

/** Elevation of the nearest airport within 30 NM, else the current ground elevation. */
export function groundElevation(w: World): number {
  let best: AirportInfo | null = null
  let bestD = 30
  for (const a of w.airports) {
    const d = distNm(a, w.ac)
    if (d < bestD) { bestD = d; best = a }
  }
  return best ? best.elevationFt : w.groundElevFt
}
