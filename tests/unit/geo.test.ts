import { describe, expect, it } from 'vitest'
import { wrap180, wrap360 } from '../../shared/utils/units'
import { bearingDeg, distNm, toLatLon, toLocal } from '../../shared/utils/geo'
import { mulberry32 } from '../../shared/utils/random'

const OLD = { lat: 13.0, lon: 77.6 }

describe('units', () => {
  it('U1 wrap360', () => {
    expect(wrap360(-90)).toBe(270)
    expect(wrap360(370)).toBe(10)
  })
  it('U2 wrap180', () => {
    expect(wrap180(190)).toBe(-170)
    expect(wrap180(-190)).toBe(170)
    expect(wrap180(10)).toBe(10)
  })
})

describe('geo', () => {
  it('G1 north offset', () => {
    const v = toLocal({ lat: 13.1, lon: 77.6 }, OLD)
    expect(v.x).toBeCloseTo(0, 3)
    expect(v.y).toBeCloseTo(6, 3)
  })
  it('G2 east offset', () => {
    const v = toLocal({ lat: 13.0, lon: 77.7 }, OLD)
    expect(v.x).toBeCloseTo(5.846, 3)
    expect(v.y).toBeCloseTo(0, 3)
  })
  it('G3 round trip', () => {
    const p = { lat: 13.05, lon: 77.55 }
    const r = toLatLon(toLocal(p))
    expect(Math.abs(r.lat - p.lat)).toBeLessThan(1e-9)
    expect(Math.abs(r.lon - p.lon)).toBeLessThan(1e-9)
  })
  it('G4 bearings', () => {
    expect(bearingDeg({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(180, 6)
    expect(bearingDeg({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(90, 6)
  })
  it('G5 distance', () => {
    expect(distNm({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('random', () => {
  it('R1 deterministic', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const sa = Array.from({ length: 5 }, () => a())
    const sb = Array.from({ length: 5 }, () => b())
    expect(sa).toEqual(sb)
  })
})
