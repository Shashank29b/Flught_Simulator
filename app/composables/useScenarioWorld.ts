import type { ScenarioDTO } from '../../shared/types'
import { createWorld, type World } from '../sim/engine'
import { TRAINER } from '../sim/aircraft'
import { RUNWAY_START } from '../sim/presets'

/**
 * Builds the initial world for a Test-mode scenario. Every test starts parked on VOBL runway 09L with everything
 * at zero (speed, throttle, autopilot off); the pilot takes off and then flies the exercise. Nav data is added by
 * store.setNavData. The scenario's stored startState is no longer used for the start position.
 */
export function buildScenarioWorld(sc: ScenarioDTO): World {
  return createWorld({
    ac: { ...RUNWAY_START, iasKt: 0, throttle: 0, gearDown: true, flapsDeg: 0 },
    wind: sc.wind,
    atmo: sc.atmosphere ?? { qnhHpa: 1013.25, isaDevC: 0 },
    radios: {
      nav1MHz: sc.radios.nav1MHz ?? 113.5, obsDeg: sc.radios.obsDeg ?? 90, adfKHz: sc.radios.adfKHz ?? 350,
      baroHpa: sc.radios.baroHpa ?? sc.atmosphere?.qnhHpa ?? 1013.25,
    },
    objective: sc.target,
    profile: TRAINER,
    ap: null,
    journey: null,
    auto: null,
  })
}
