import { describe, expect, it } from 'vitest'
import { buildScenarioWorld } from '../../app/composables/useScenarioWorld'
import type { ScenarioDTO } from '../../shared/types'

const sc: ScenarioDTO = {
  id: 2, title: 'BBG radial', description: '', week: 1,
  startState: { onGround: false, x: -10, y: 0, altFt: 6000, iasKt: 120, throttle: 0.86 },
  target: { type: 'TRACK_RADIAL', stationIdent: 'BBG', radialDeg: 0, toFrom: 'TO', holdSec: 60 },
  wind: { fromDeg: 270, speedKt: 10 }, failures: [], traffic: [], radios: { nav1MHz: 115.5, obsDeg: 180 },
}

describe('Test-mode start', () => {
  it('always starts parked on runway 09L with everything at zero', () => {
    const w = buildScenarioWorld(sc)
    expect(w.ac).toMatchObject({ onGround: true, iasKt: 0, throttle: 0, gearDown: true, hdgDeg: 90.5, altFt: 3000, vsFpm: 0 })
    expect(Math.hypot(w.ac.x, w.ac.y)).toBeCloseTo(0.05, 6)
    expect(w.ap).toBeNull()
    expect(w.journey).toBeNull()
    expect(w.profile.id).toBe('trainer')
  })
  it('keeps the scenario radios, wind and objective', () => {
    const w = buildScenarioWorld(sc)
    expect(w.radios.nav1MHz).toBe(115.5)
    expect(w.wind).toEqual({ fromDeg: 270, speedKt: 10 })
    expect(w.objective?.type).toBe('TRACK_RADIAL')
  })
})
