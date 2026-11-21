import { describe, expect, it } from 'vitest'
import { airspeedNeedleDeg, altHands, vsiNeedleDeg } from '../../app/components/instruments/gauges'

describe('gauge mapping', () => {
  it('airspeed 100 kt', () => expect(airspeedNeedleDeg(100)).toBe(160))
  it('altimeter 3450 ft', () => {
    const h = altHands(3450)
    expect(h.hundredsDeg).toBeCloseTo(162, 6)
    expect(h.thousandsDeg).toBeCloseTo(124.2, 6)
  })
  it('vsi 1000 and clamp', () => {
    expect(vsiNeedleDeg(1000)).toBe(80)
    expect(vsiNeedleDeg(-3000)).toBe(-160)
  })
})
