import { describe, expect, it } from 'vitest'
import { createWorld, simStep, type World } from '../../app/sim/engine'
import { apFromAircraft, fma, type ApState } from '../../app/systems/autopilot'
import { TRAINER } from '../../app/sim/aircraft'
import { AIRPORT_ELEV_FT as E } from '../../shared/utils/units'
import { RWY09, SEED_STATIONS, air } from './helpers/fixtures'

const THR = 120 / 140
function fly(w: World, seconds: number, until?: (w: World) => boolean): World {
  let s = w
  for (let i = 0; i < seconds * 20; i++) {
    s = simStep(s, { roll: 0, pitch: 0, throttle: THR }, 1 / 20)
    if (until?.(s)) break
  }
  return s
}
const world = (p: Parameters<typeof air>[0], ap: Partial<ApState>, nav1MHz = 110.3) => {
  const ac = air({ iasKt: 120, throttle: THR, ...p })
  return createWorld({ profile: TRAINER, stations: SEED_STATIONS, runways: [RWY09], radios: { nav1MHz, obsDeg: 90 }, ac, ap: { ...apFromAircraft(ac), ...ap } })
}

describe('autopilot (§8, closed loop, trainer at 120 kt)', () => {
  it('AP1 HDG 000 → 090', () => {
    const e = fly(world({ hdgDeg: 0, altFt: E + 3000 }, { hdgDeg: 90, altFt: E + 3000 }), 60)
    expect(Math.abs(e.ac.hdgDeg - 90)).toBeLessThan(2)
    expect(Math.abs(e.ac.bankDeg)).toBeLessThan(3)
  })
  it('AP2 ALT 3000 → 4000 ft AGL', () => {
    const e = fly(world({ altFt: E + 3000 }, { altFt: E + 4000 }), 120)
    expect(Math.abs(e.ac.altFt - (E + 4000))).toBeLessThan(50)
  })
  it('VS climbs at the selected rate and levels off at the selected altitude', () => {
    const w = world({ altFt: E + 3000 }, { vertical: 'VS', vsFpm: 500, altFt: E + 3600 })
    const mid = fly(w, 20)
    expect(Math.abs(mid.ac.vsFpm - 500)).toBeLessThan(80)
    const end = fly(mid, 100)
    expect(end.ap?.vertical).toBe('ALT')
    expect(Math.abs(end.ac.altFt - (E + 3600))).toBeLessThan(50)
  })
  it('AP3 APP captures and tracks the localiser from an intercept heading', () => {
    const e = fly(world({ x: -12, y: 1.0, hdgDeg: 120, altFt: E + 2500 }, { lateral: 'APP', hdgDeg: 120, altFt: E + 2500 }), 240)
    expect(e.nav.ils?.locValid).toBe(true)
    expect(Math.abs(e.nav.ils!.locDevDeg)).toBeLessThan(0.25)
    expect(e.ap?.navCaptured).toBe(true)
  })
  it('AP4 APP captures the glide slope from below and tracks it', () => {
    const w = world({ x: -8, y: 0, hdgDeg: 90, altFt: E + 2000 }, { lateral: 'APP', hdgDeg: 90, altFt: E + 2000 })
    const e = fly(w, 400, s => s.ac.x >= -2)
    expect(e.ap?.gsCaptured).toBe(true)
    expect(e.ac.x).toBeGreaterThanOrEqual(-2)
    expect(Math.abs(e.nav.ils!.gsDevDeg)).toBeLessThan(0.2)
  })
  it('NAV captures a VOR radial (TRN R-270 inbound, course 090)', () => {
    const e = fly(world({ x: -15, y: 4, hdgDeg: 60, altFt: E + 3000 }, { lateral: 'NAV', hdgDeg: 60, altFt: E + 3000 }, 113.5), 300)
    expect(e.ap?.navCaptured).toBe(true)
    expect(Math.abs(e.nav.vor1!.cdiDevDeg)).toBeLessThan(1.5)
  })
  it('A/THR holds the selected speed', () => {
    const e = fly(world({ altFt: E + 3000 }, { athr: true, spdKt: 100 }), 30)
    expect(Math.abs(e.ac.iasKt - 100)).toBeLessThan(1)
  })
  it('FMA text', () => {
    const a = { ...apFromAircraft(air({ hdgDeg: 90, altFt: 6000 })), lateral: 'APP' as const }
    expect(fma(a)).toMatchObject({ lateral: 'HDG 090', vertical: 'ALT 6000', armed: 'LOC G/S', thrust: 'MAN THR' })
  })
})
