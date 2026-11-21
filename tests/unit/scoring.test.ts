import { describe, expect, it } from 'vitest'
import { score } from '../../server/services/scoring.logic'
import { meanAbsLocFrac } from '../../server/services/flights.logic'

describe('scoring', () => {
  it('S1 mixed landing = 69', () => expect(score('LANDED', { lateralM: 20, vsFpm: -600, meanAbsLocFrac: 0.2 }).total).toBe(69))
  it('S2 perfect landing = 100', () => expect(score('LANDED', { lateralM: 0, vsFpm: -200, meanAbsLocFrac: 0 }).total).toBe(100))
  it('S3 crash = 0', () => expect(score('CRASHED').total).toBe(0))
  it('completed = 100, aborted = 0', () => {
    expect(score('COMPLETED').total).toBe(100)
    expect(score('ABORTED').total).toBe(0)
  })
})

describe('meanAbsLocFrac', () => {
  it('averages |locFrac| within 4 NM', () => {
    const s = [{ x: -1, nav: { locFrac: 0.2 } }, { x: -2, nav: { locFrac: -0.2 } }, { x: -3, nav: { locFrac: 0.4 } }, { x: -6, nav: { locFrac: 1 } }, { x: -1, nav: {} }]
    expect(meanAbsLocFrac(s)).toBeCloseTo(0.2667, 3)
  })
  it('is 0 without samples', () => expect(meanAbsLocFrac([])).toBe(0))
})
