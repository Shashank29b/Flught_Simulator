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
  it('E2 full throttle then rotate becomes airborne (jet rotates at 145 kt)', () => {
    let w = run(createWorld(), { roll: 0, pitch: 0, throttle: 1 }, 35)
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

describe('frame re-centring', async () => {
  const { rebaseWorld, groundElevation } = await import('../../app/sim/engine')
  const { toLatLon } = await import('../../shared/utils/geo')
  const { SEED_STATIONS, air } = await import('./helpers/fixtures')
  it('keeps every object at the same lat/lon', () => {
    const w = createWorld({ stations: SEED_STATIONS, ac: air({ x: 45, y: -10 }) })
    const before = { ac: toLatLon(w.ac, w.ref), st: toLatLon(w.stations[0]!, w.ref) }
    const r = rebaseWorld(w, toLatLon(w.ac, w.ref))
    expect(Math.hypot(r.ac.x, r.ac.y)).toBeLessThan(1e-9)
    const after = { ac: toLatLon(r.ac, r.ref), st: toLatLon(r.stations[0]!, r.ref) }
    expect(after.ac.lat).toBeCloseTo(before.ac.lat, 9)
    expect(after.st.lon).toBeCloseTo(before.st.lon, 9)
    expect(r.ac.hdgDeg).toBe(w.ac.hdgDeg)
  })
  it('takes the ground elevation from the nearest airport', () => {
    const w = createWorld({ ac: air({ x: 5, y: 0 }), airports: [
      { id: 1, ident: 'AAA', name: 'A', iata: null, type: 'small_airport', x: 0, y: 0, elevationFt: 100 },
      { id: 2, ident: 'BBB', name: 'B', iata: null, type: 'small_airport', x: 50, y: 0, elevationFt: 5000 },
    ] })
    expect(groundElevation(w)).toBe(100)
  })
})

describe('engine ILS', async () => {
  const { SEED_STATIONS, RWY09, air } = await import('./helpers/fixtures')
  const { AIRPORT_ELEV_FT, NM_TO_FT, deg2rad } = await import('../../shared/utils/units')
  it('E6 established on the localiser and glide slope 8 NM out', () => {
    const d = Math.hypot(-8 - 0.16, 0 + 0.08) // to the GS antenna
    const w = createWorld({ stations: SEED_STATIONS, runways: [RWY09], ac: air({ x: -8, y: 0, hdgDeg: 90, altFt: AIRPORT_ELEV_FT + d * NM_TO_FT * Math.tan(deg2rad(3)) }), radios: { nav1MHz: 110.3 } })
    const e = simStep(w, { roll: 0, pitch: 0, throttle: 120 / 350 }, 1 / 60)
    expect(e.nav.ils?.locValid).toBe(true)
    expect(Math.abs(e.nav.ils!.locDevDeg)).toBeLessThan(0.05)
    expect(e.nav.ils?.gsValid).toBe(true)
    expect(Math.abs(e.nav.ils!.gsDevDeg)).toBeLessThan(0.05)
    expect(e.nav.raFt).toBeNull() // ≈ 2600 ft AGL: above the 2500 ft radio-altimeter limit
  })
  it('E6b the outer marker sounds overhead', () => {
    const w = createWorld({ stations: SEED_STATIONS, runways: [RWY09], ac: air({ x: -4.5, y: 0, altFt: AIRPORT_ELEV_FT + 1400 }) })
    expect(simStep(w, { roll: 0, pitch: 0, throttle: 0.4 }, 1 / 60).nav.markers?.om).toBe(true)
  })
})

describe('engine touchdown', async () => {
  const { RWY09, air } = await import('./helpers/fixtures')
  const { AIRPORT_ELEV_FT } = await import('../../shared/utils/units')
  it('E7 Test mode LAND objective ends with LANDED', () => {
    const w = createWorld({ runways: [RWY09], objective: { type: 'LAND', runwayIdent: '09' }, ac: air({ x: 0.1, y: 0, altFt: AIRPORT_ELEV_FT + 30, pitchDeg: -1, iasKt: 140, throttle: 140 / 350, gearDown: true }) })
    const e = run(w, { roll: 0, pitch: 0, throttle: 140 / 350 }, 10)
    expect(e.done?.result).toBe('LANDED')
    expect(e.lastTouchdown?.runwayIdent).toBe('09')
  })
  it('free flight records the touchdown but keeps flying', () => {
    const w = createWorld({ runways: [RWY09], ac: air({ x: 0.1, y: 0, altFt: AIRPORT_ELEV_FT + 30, pitchDeg: -1, iasKt: 140, throttle: 0.4, gearDown: false }) })
    const e = run(w, { roll: 0, pitch: 0, throttle: 0.4 }, 10)
    expect(e.done).toBeNull()
    expect(e.lastTouchdown?.result).toBe('CRASHED')
  })
})

describe('engine INS/GPS', async () => {
  const { navPositions } = await import('../../app/sim/engine')
  const { air } = await import('./helpers/fixtures')
  it('E10 after 5 min the INS has drifted but the blended position stays close', () => {
    const e = run(createWorld({ ac: air({ hdgDeg: 90 }) }), { roll: 0, pitch: 0, throttle: 120 / 350 }, 300, 0.1)
    const p = navPositions(e)
    const insM = Math.hypot(p.ins.x - p.truth.x, p.ins.y - p.truth.y) * 1852
    const blendM = Math.hypot(p.blend.x - p.truth.x, p.blend.y - p.truth.y) * 1852
    expect(insM).toBeGreaterThan(100)
    expect(blendM).toBeLessThan(30)
  })
})
