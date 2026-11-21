import { describe, expect, it } from 'vitest'
import { keysToControls } from '../../app/sim/input'

describe('keyboard mapping', () => {
  it('K1 left arrow rolls left', () => {
    expect(keysToControls(new Set(['ArrowLeft']), 0, 0.1).roll).toBe(-1)
  })
  it('K2 W adds 0.5 throttle per second', () => {
    expect(keysToControls(new Set(['w']), 0, 1).throttle).toBeCloseTo(0.5, 9)
  })
  it('K3 throttle clamps at 1', () => {
    expect(keysToControls(new Set(['w']), 0.9, 1).throttle).toBe(1)
  })
})
