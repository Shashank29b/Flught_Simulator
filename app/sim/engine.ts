import { AIRPORT_ELEV_FT } from '../../shared/utils/units'
import { REF, distNm, toLatLon, toLocal, type LatLon } from '../../shared/utils/geo'
import type { AirportInfo, AircraftState, Atmosphere, Controls, FlightResult, NavOutputs, NavStation, Objective, RunwayInfo, Wind } from '../../shared/types'
import { evaluateObjective, type ObjProgress } from './objectives'
import { DEFAULT_STATE, step } from './flightModel'
import { vorReceive } from '../nav/vor'
import { dmeReceive } from '../nav/dme'
import { adfReceive } from '../nav/adf'

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
  }
}

/** Advances the whole simulated world by dt seconds. Pure. */
export function simStep(w: World, c: Controls, dt: number): World {
  if (w.done) return w
  const ac = step(w.ac, c, w.wind, dt, w.atmo, w.groundElevFt)
  const r = w.radios
  const nav: Partial<NavOutputs> = {
    ...w.nav,
    vor1: vorReceive(w.stations, r.nav1MHz, r.obsDeg, ac, w.groundElevFt),
    dme1: dmeReceive(w.stations, r.nav1MHz, ac, w.groundElevFt),
    adf: adfReceive(w.stations, r.adfKHz, ac, w.groundElevFt),
  }
  let next: World = { ...w, ac, nav, simMs: w.simMs + dt * 1000 }
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
