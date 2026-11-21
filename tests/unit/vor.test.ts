import { describe, expect, it } from 'vitest'
import { cdi, radialDeg, vorReceive } from '../../app/nav/vor'
import { inRange, losNm } from '../../app/nav/range'
import { air, station } from './helpers/fixtures'
import { AIRPORT_ELEV_FT } from '../../shared/utils/units'

const O = { x: 0, y: 0 }
describe('vor', () => {
  it('V1 radial south', () => expect(radialDeg(O, { x: 0, y: -10 }, 'DVOR')).toBeCloseTo(180, 2))
  it('V2 radial east', () => expect(radialDeg(O, { x: 10, y: 0 }, 'DVOR')).toBeCloseTo(90, 2))
  it('V3 site error CVOR vs DVOR', () => {
    const p = { x: Math.sin(Math.PI / 4) * 10, y: Math.cos(Math.PI / 4) * 10 }
    expect(radialDeg(O, p, 'VOR')).toBeCloseTo(46.5, 2)
    expect(radialDeg(O, p, 'DVOR')).toBeCloseTo(45.3, 2)
  })
  it('C1', () => expect(cdi(80, 90)).toEqual({ toFrom: 'FROM', cdiDevDeg: 10, cdiFrac: 1 }))
  it('C2', () => expect(cdi(85, 90)).toEqual({ toFrom: 'FROM', cdiDevDeg: 5, cdiFrac: 0.5 }))
  it('C3', () => {
    const r = cdi(280, 90)
    expect(r.toFrom).toBe('TO')
    expect(r.cdiDevDeg).toBeCloseTo(10, 9)
  })
  it('C4', () => {
    const r = cdi(265, 90)
    expect(r.toFrom).toBe('TO')
    expect(r.cdiDevDeg).toBeCloseTo(-5, 9)
  })
  it('C5', () => expect(cdi(0, 90).toFrom).toBe('OFF'))
  it('R1 line of sight', () => expect(losNm(AIRPORT_ELEV_FT + 10000)).toBeCloseTo(123, 6))
  it('R2 out of range on the ground', () => {
    expect(inRange(station({}), air({ x: 50, altFt: AIRPORT_ELEV_FT }))).toBe(false)
  })
  it('wrong frequency is invalid', () => {
    expect(vorReceive([station({})], 116.2, 90, air({ x: -10 })).valid).toBe(false)
  })
  it('receives a tuned VOR', () => {
    const v = vorReceive([station({ type: 'DVOR' })], 113.5, 90, air({ x: -10 }))
    expect(v.valid).toBe(true)
    expect(v.toFrom).toBe('TO')
  })
})
