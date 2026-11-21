import { describe, expect, it } from 'vitest'
import { dmeReceive } from '../../app/nav/dme'
import { air, station } from './helpers/fixtures'

describe('dme', () => {
  it('D1 slant range 3-4-5', () => {
    const d = dmeReceive([station({ type: 'DME' })], 113.5, air({ x: 3, y: 0, altFt: 900 + 24304.48 }))
    expect(d.valid).toBe(true)
    expect(Math.abs(d.distNm - 5)).toBeLessThan(0.001)
  })
  it('no DME on the frequency', () => {
    expect(dmeReceive([station({ type: 'VOR' })], 113.5, air()).valid).toBe(false)
  })
})
