import { describe, expect, it } from 'vitest'
import {
  atmosphereAt, casToTas, densityAltitudeFt, indicatedAltitudeFt, isaPressure, pressureAltitudeFt, tasToCas,
} from '../../shared/utils/isa'

describe('ISA atmosphere', () => {
  it('IS1 sea level', () => {
    const a = atmosphereAt(0)
    expect(a.tempK).toBeCloseTo(288.15, 3)
    expect(a.pressurePa).toBeCloseTo(101325, 0)
    expect(a.density).toBeCloseTo(1.225, 4)
    expect(a.speedOfSoundKt).toBeCloseTo(661.48, 1)
  })
  it('IS2 5000 ft', () => {
    const a = atmosphereAt(5000)
    expect(a.tempK).toBeCloseTo(278.244, 2)
    expect(Math.abs(a.pressurePa - 84307.3)).toBeLessThan(1)
    expect(a.density).toBeCloseTo(1.05555, 4)
  })
  it('IS3 10000 ft', () => {
    const a = atmosphereAt(10000)
    expect(a.tempK).toBeCloseTo(268.338, 2)
    expect(Math.abs(a.pressurePa - 69681.6)).toBeLessThan(1)
    expect(a.density).toBeCloseTo(0.904637, 4)
    expect(a.oatC).toBeCloseTo(-4.81, 1)
  })
  it('IS4 tropopause and stratosphere', () => {
    expect(atmosphereAt(36089).tempK).toBeCloseTo(216.65, 2)
    expect(Math.abs(atmosphereAt(40000).pressurePa - 18753.9)).toBeLessThan(2)
    expect(atmosphereAt(40000).density).toBeCloseTo(0.301558, 4)
  })
  it('IS5 pressure altitude is the inverse of ISA pressure', () => {
    for (const h of [0, 3000, 10000, 25000, 40000]) expect(pressureAltitudeFt(isaPressure(h))).toBeCloseTo(h, 3)
  })
  it('IS6 ISA+15 lowers density', () => {
    expect(atmosphereAt(10000, { qnhHpa: 1013.25, isaDevC: 15 }).density).toBeCloseTo(0.856745, 4)
  })
})

describe('airspeeds', () => {
  it('AS1 CAS = TAS at sea level ISA', () => expect(casToTas(120, 0).tasKt).toBeCloseTo(120, 2))
  it('AS2 120 kt CAS', () => {
    expect(casToTas(120, 3900).tasKt).toBeCloseTo(127.066, 2)
    expect(casToTas(100, 3900).tasKt).toBeCloseTo(105.908, 2)
    const r = casToTas(120, 10000)
    expect(r.tasKt).toBeCloseTo(139.384, 2)
    expect(r.mach).toBeCloseTo(0.2184, 3)
  })
  it('AS3 high altitude compressible', () => {
    const r = casToTas(250, 30000)
    expect(r.tasKt).toBeCloseTo(393.731, 1)
    expect(r.mach).toBeCloseTo(0.6681, 3)
  })
  it('AS4 hot day raises TAS', () => expect(casToTas(120, 10000, { qnhHpa: 1013.25, isaDevC: 15 }).tasKt).toBeCloseTo(143.226, 2))
  it('AS5 tasToCas round trip', () => {
    for (const [c, h] of [[80, 2000], [140, 8000], [250, 30000]] as const) expect(tasToCas(casToTas(c, h).tasKt, h)).toBeCloseTo(c, 4)
  })
})

describe('altimetry', () => {
  const low = { qnhHpa: 1003, isaDevC: 0 }
  it('AL1 standard setting in a low reads high', () => expect(indicatedAltitudeFt(3000, 1013.25, low)).toBeCloseTo(3275.3, 0))
  it('AL2 QNH set reads true altitude', () => expect(indicatedAltitudeFt(3000, 1003, low)).toBeCloseTo(3000, 3))
  it('AL3 density altitude equals altitude on an ISA day', () => expect(densityAltitudeFt(5000)).toBeCloseTo(5000, 0))
  it('AL4 hot day density altitude is higher', () => expect(densityAltitudeFt(5000, { qnhHpa: 1013.25, isaDevC: 20 })).toBeGreaterThan(7000))
})
