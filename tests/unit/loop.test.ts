import { describe, expect, it } from 'vitest'
import { advance } from '../../app/sim/loop'

describe('loop', () => {
  it('L1 three steps in 50 ms', () => {
    const r = advance(0, 0.05)
    expect(r.steps).toBe(3)
    expect(Math.abs(r.acc)).toBeLessThan(1e-9)
  })
  it('L2 caps at 5 steps', () => {
    expect(advance(0, 1).steps).toBe(5)
  })
})
