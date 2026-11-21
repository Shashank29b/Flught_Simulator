import type { AircraftState, Controls, NavOutputs, NavStation, RunwayInfo, Wind } from '../../shared/types'
import { DEFAULT_STATE, step } from './flightModel'
import { vorReceive } from '../nav/vor'
import { dmeReceive } from '../nav/dme'

export interface Radios { nav1MHz: number; obsDeg: number; adfKHz: number }

export interface World {
  ac: AircraftState
  simMs: number
  wind: Wind | null
  stations: NavStation[]
  runways: RunwayInfo[]
  radios: Radios
  nav: Partial<NavOutputs>
}

export const DEFAULT_RADIOS: Radios = { nav1MHz: 113.5, obsDeg: 90, adfKHz: 350 }

export function createWorld(init: Partial<World> = {}): World {
  return {
    ac: { ...DEFAULT_STATE, ...(init.ac ?? {}) },
    simMs: init.simMs ?? 0,
    wind: init.wind ?? null,
    stations: init.stations ?? [],
    runways: init.runways ?? [],
    radios: { ...DEFAULT_RADIOS, ...(init.radios ?? {}) },
    nav: init.nav ?? {},
  }
}

/** Advances the whole simulated world by dt seconds. Pure. */
export function simStep(w: World, c: Controls, dt: number): World {
  const ac = step(w.ac, c, w.wind, dt)
  const r = w.radios
  const nav: Partial<NavOutputs> = {
    ...w.nav,
    vor1: vorReceive(w.stations, r.nav1MHz, r.obsDeg, ac),
    dme1: dmeReceive(w.stations, r.nav1MHz, ac),
  }
  return { ...w, ac, nav, simMs: w.simMs + dt * 1000 }
}
