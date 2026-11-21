import { describe, expect, it } from 'vitest'
import { judgeTouchdown } from '../../app/sim/landing'
import { AIRPORT_ELEV_FT } from '../../shared/utils/units'
import { RWY09, air } from './helpers/fixtures'

const at = (p: Parameters<typeof air>[0] = {}) => air({ x: 0.2, y: -10 / 1852, altFt: AIRPORT_ELEV_FT, vsFpm: -400, bankDeg: 2, gearDown: true, ...p })
const judge = (p: Parameters<typeof air>[0] = {}) => judgeTouchdown(at(p), at(p), [RWY09])

describe('touchdown judge (§7)', () => {
  it('T1 good landing', () => {
    const t = judge()
    expect(t.result).toBe('LANDED')
    expect(t.lateralM).toBeCloseTo(10, 1)
    expect(Math.abs(t.alongM - 370.4)).toBeLessThan(0.5)
    expect(t.runwayIdent).toBe('09')
  })
  it('T2 gear up', () => expect(judge({ gearDown: false }).result).toBe('CRASHED'))
  it('T3 off the edge', () => expect(judge({ y: 30 / 1852 }).reasons[0]).toMatch(/edge/))
  it('T4 hard landing', () => expect(judge({ vsFpm: -1000 }).result).toBe('CRASHED'))
  it('T5 short of the threshold', () => expect(judge({ x: -0.1 }).reasons.join()).toMatch(/short/))
  it('away from any runway', () => expect(judge({ x: 20, y: 20 }).reasons[0]).toMatch(/away/))
})
