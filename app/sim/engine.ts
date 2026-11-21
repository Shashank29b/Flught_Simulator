import type { AircraftState, Controls, FlightResult, NavOutputs, NavStation, Objective, RunwayInfo, Wind } from '../../shared/types'
import { evaluateObjective, type ObjProgress } from './objectives'
import { DEFAULT_STATE, step } from './flightModel'
import { vorReceive } from '../nav/vor'
import { dmeReceive } from '../nav/dme'
import { adfReceive } from '../nav/adf'

export interface Radios { nav1MHz: number; obsDeg: number; adfKHz: number }

export interface World {
  ac: AircraftState
  simMs: number
  wind: Wind | null
  stations: NavStation[]
  runways: RunwayInfo[]
  radios: Radios
  nav: Partial<NavOutputs>
  objective: Objective | null
  objProgress: ObjProgress
  done: { result: FlightResult; landing?: { lateralM: number; vsFpm: number }; reasons?: string[] } | null
  fmsComplete: boolean
}

export const DEFAULT_RADIOS: Radios = { nav1MHz: 113.5, obsDeg: 90, adfKHz: 350 }

export function createWorld(init: Partial<Omit<World, 'ac'>> & { ac?: Partial<AircraftState> } = {}): World {
  return {
    ac: { ...DEFAULT_STATE, ...(init.ac ?? {}) },
    simMs: init.simMs ?? 0,
    wind: init.wind ?? null,
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
  const ac = step(w.ac, c, w.wind, dt)
  const r = w.radios
  const nav: Partial<NavOutputs> = {
    ...w.nav,
    vor1: vorReceive(w.stations, r.nav1MHz, r.obsDeg, ac),
    dme1: dmeReceive(w.stations, r.nav1MHz, ac),
    adf: adfReceive(w.stations, r.adfKHz, ac),
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
