import { describe, expect, it } from 'vitest'
import { keysToControls, manualInput } from '../../app/sim/input'

describe('keyboard mapping', () => {
  it('K1 A rolls left, D rolls right', () => {
    expect(keysToControls(new Set(['a']), 0, 0.1).roll).toBe(-1)
    expect(keysToControls(new Set(['d']), 0, 0.1).roll).toBe(1)
  })
  it('K2 W = stick forward (nose down), S = stick back (nose up)', () => {
    expect(keysToControls(new Set(['w']), 0, 0.1).pitch).toBe(-1)
    expect(keysToControls(new Set(['s']), 0, 0.1).pitch).toBe(1)
  })
  it('K3 Q/E yaw', () => {
    expect(keysToControls(new Set(['q']), 0, 0.1).yaw).toBe(-1)
    expect(keysToControls(new Set(['E']), 0, 0.1).yaw).toBe(1)
  })
  it('K4 arrow up adds 0.5 throttle per second and clamps at 1', () => {
    expect(keysToControls(new Set(['ArrowUp']), 0, 1).throttle).toBeCloseTo(0.5, 9)
    expect(keysToControls(new Set(['ArrowUp']), 0.9, 1).throttle).toBe(1)
    expect(keysToControls(new Set(['ArrowDown']), 0.2, 1).throttle).toBe(0)
  })
  it('K5 manual input detection ignores throttle keys', () => {
    expect(manualInput(new Set(['ArrowUp']))).toBe(false)
    expect(manualInput(new Set(['a']))).toBe(true)
  })
})
