import type { ScenarioDTO, NavStation, RunwayInfo } from '../../shared/types'
import { createWorld, type World } from '../sim/engine'

/** Builds the initial world for a scenario. */
export function buildScenarioWorld(sc: ScenarioDTO, stations: NavStation[], runways: RunwayInfo[]): World {
  return createWorld({
    ac: sc.startState,
    wind: sc.wind,
    stations,
    runways,
    atmo: sc.atmosphere ?? { qnhHpa: 1013.25, isaDevC: 0 },
    radios: {
      nav1MHz: sc.radios.nav1MHz ?? 113.5, obsDeg: sc.radios.obsDeg ?? 90, adfKHz: sc.radios.adfKHz ?? 350,
      baroHpa: sc.radios.baroHpa ?? sc.atmosphere?.qnhHpa ?? 1013.25,
    },
    objective: sc.target,
  })
}
