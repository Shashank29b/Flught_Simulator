import type { ScenarioDTO } from '../../shared/types'
import { createWorld, type World } from '../sim/engine'
import { TRAINER } from '../sim/aircraft'

/** Builds the initial world for a scenario (VOBL frame); nav data is added by store.setNavData. */
export function buildScenarioWorld(sc: ScenarioDTO): World {
  return createWorld({
    ac: sc.startState,
    wind: sc.wind,
    atmo: sc.atmosphere ?? { qnhHpa: 1013.25, isaDevC: 0 },
    radios: {
      nav1MHz: sc.radios.nav1MHz ?? 113.5, obsDeg: sc.radios.obsDeg ?? 90, adfKHz: sc.radios.adfKHz ?? 350,
      baroHpa: sc.radios.baroHpa ?? sc.atmosphere?.qnhHpa ?? 1013.25,
    },
    objective: sc.target,
    profile: TRAINER,
  })
}
