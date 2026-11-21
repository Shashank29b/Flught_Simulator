import { describe, expect, it } from 'vitest'
import { ilsReceive } from '../../app/nav/ils'
import { markersReceive } from '../../app/nav/markers'
import { callouts, radioAltFt } from '../../app/nav/radioAlt'
import { AIRPORT_ELEV_FT as E } from '../../shared/utils/units'
import { RWY09, air, station } from './helpers/fixtures'

// §6: LOC antenna at (0,0), runway hdg 90, range 25; GS antenna at (0,0), range 10.
const LOC = station({ type: 'ILS_LOC', frequency: 110.3, rangeNm: 25, runwayId: 1 })
const GS = station({ id: 98, type: 'ILS_GS', frequency: 110.3, rangeNm: 10, runwayId: 1 })
const ils = (x: number, y: number, altFt = E + 3000) => ilsReceive([LOC, GS], [RWY09], 110.3, air({ x, y, altFt }))

describe('localiser', () => {
  it('I1 left of centreline → fly right', () => {
    const r = ils(-10, 0.17455)
    expect(r.locDevDeg).toBeCloseTo(1, 2)
    expect(r.locFrac).toBeCloseTo(0.4, 2)
  })
  it('I2 right of centreline → fly left', () => {
    const r = ils(-10, -0.17455)
    expect(r.locDevDeg).toBeCloseTo(-1, 2)
    expect(r.locFrac).toBeCloseTo(-0.4, 2)
  })
  it('I3 clamps at full scale', () => expect(ils(-10, 1).locFrac).toBe(1))
  it('I4 invalid outside the ±35° sector', () => expect(ils(5, 3).locValid).toBe(false))
  it('invalid when tuned to another frequency', () => expect(ilsReceive([LOC, GS], [RWY09], 109.9, air({ x: -5 })).locValid).toBe(false))
})

describe('glide slope', () => {
  it('S1 on the 3° path', () => expect(Math.abs(ils(-3, 0, E + 955.31).gsDevDeg)).toBeLessThan(0.01))
  it('S2 high → fly down, full scale', () => {
    const r = ils(-3, 0, E + 1500)
    expect(r.gsDevDeg).toBeCloseTo(-1.70, 2)
    expect(r.gsFrac).toBe(-1)
  })
  it('S3 low → fly up', () => {
    const r = ils(-3, 0, E + 800)
    expect(r.gsDevDeg).toBeCloseTo(0.49, 2)
    expect(Math.abs(r.gsFrac - 0.70)).toBeLessThan(0.01)
  })
  it('GS out of range (> 10 NM) is invalid while the LOC is valid', () => {
    const r = ils(-15, 0)
    expect(r.locValid).toBe(true)
    expect(r.gsValid).toBe(false)
  })
})

describe('marker beacons and radio altimeter', () => {
  const OM = station({ type: 'MARKER_OM', frequency: 75, x: -4.5, y: 0, rangeNm: 1 })
  it('M1 overhead the OM at 1500 ft AGL', () => expect(markersReceive([OM], air({ x: -4.5, y: 0, altFt: E + 1500 })).om).toBe(true))
  it('M2 0.5 NM before the OM is silent', () => expect(markersReceive([OM], air({ x: -5, y: 0, altFt: E + 1500 })).om).toBe(false))
  it('RA1 null above 2500 ft AGL, height below', () => {
    expect(radioAltFt(air({ altFt: E + 3000 }))).toBeNull()
    expect(radioAltFt(air({ altFt: E + 400 }))).toBe(400)
  })
  it('CO1 / CO2 callouts', () => {
    expect(callouts(1020, 980)).toEqual([1000])
    expect(callouts(520, 40)).toEqual([500, 100, 50])
    expect(callouts(40, 520)).toEqual([])
  })
})
