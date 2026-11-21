import { describe, expect, it } from 'vitest'
import { createWorld, simStep, type World } from '../../app/sim/engine'
import type { Controls } from '../../shared/types'

export function run(w: World, c: Controls, seconds: number, dt = 1 / 60): World {
  let s = w
  for (let i = 0; i < Math.round(seconds / dt); i++) s = simStep(s, c, dt)
  return s
}

describe('engine', () => {
  it('E1 stays put on the runway with no input', () => {
    const w = createWorld()
    const e = run(w, { roll: 0, pitch: 0, throttle: 0 }, 5)
    expect(e.ac.x).toBe(w.ac.x)
    expect(e.ac.y).toBe(w.ac.y)
    expect(e.simMs).toBeCloseTo(5000, 3)
  })
  it('E2 full throttle then rotate becomes airborne', () => {
    let w = run(createWorld(), { roll: 0, pitch: 0, throttle: 1 }, 25)
    w = run(w, { roll: 0, pitch: 1, throttle: 1 }, 3)
    w = run(w, { roll: 0, pitch: 0, throttle: 1 }, 12)
    expect(w.ac.onGround).toBe(false)
  })
})

describe('engine nav receivers', async () => {
  const { SEED_STATIONS, air } = await import('./helpers/fixtures')
  it('E3 inbound on the TRN 270 radial', () => {
    const w = createWorld({ stations: SEED_STATIONS, ac: air({ x: -10, y: 6, hdgDeg: 90 }), radios: { nav1MHz: 113.5, obsDeg: 90, adfKHz: 350 } })
    const e = simStep(w, { roll: 0, pitch: 0, throttle: 120 / 140 }, 1 / 60)
    expect(e.nav.vor1?.valid).toBe(true)
    expect(e.nav.vor1?.toFrom).toBe('TO')
    expect(Math.abs(e.nav.vor1!.cdiDevDeg)).toBeLessThan(0.5)
    expect(Math.abs(e.nav.dme1!.distNm - 12)).toBeLessThan(0.2)
  })
})

describe('engine adf', async () => {
  const { SEED_STATIONS, air } = await import('./helpers/fixtures')
  it('E4 NDB dead ahead', () => {
    const w = createWorld({ stations: SEED_STATIONS, ac: air({ x: -25, y: -2, hdgDeg: 180 }), radios: { nav1MHz: 113.5, obsDeg: 90, adfKHz: 350 } })
    const e = simStep(w, { roll: 0, pitch: 0, throttle: 120 / 140 }, 1 / 60)
    expect(e.nav.adf?.valid).toBe(true)
    const r = e.nav.adf!.relBearingDeg
    expect(Math.min(r, 360 - r)).toBeLessThan(0.5)
  })
})

describe('engine wind', () => {
  it('E5 westerly drifts east', () => {
    const w = createWorld({ ac: { onGround: false, gearDown: false, altFt: 3900, hdgDeg: 0, iasKt: 120, throttle: 120 / 140, x: 0, y: 0 }, wind: { fromDeg: 270, speedKt: 20 } })
    const e = run(w, { roll: 0, pitch: 0, throttle: 120 / 140 }, 60)
    expect(Math.abs(e.ac.x - 0.333)).toBeLessThan(0.02)
  })
})
