import { describe, expect, it } from 'vitest'
import { adfReceive } from '../../app/nav/adf'
import { air, station } from './helpers/fixtures'

const ndb = [station({ type: 'NDB', frequency: 350, rangeNm: 50 })]
const rel = (x: number, y: number, hdgDeg: number) => adfReceive(ndb, 350, air({ x, y, hdgDeg })).relBearingDeg

describe('adf', () => {
  it('A1', () => expect(rel(0, -10, 0)).toBeCloseTo(0, 6))
  it('A2', () => expect(rel(0, -10, 90)).toBeCloseTo(270, 6))
  it('A3', () => expect(rel(10, 0, 0)).toBeCloseTo(270, 6))
  it('A4', () => expect(rel(10, 0, 270)).toBeCloseTo(0, 6))
  it('invalid when untuned', () => expect(adfReceive(ndb, 351, air()).valid).toBe(false))
})
