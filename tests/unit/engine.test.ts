import { describe, expect, it } from 'vitest'
import { createWorld, simStep, type World } from '../../app/sim/engine'
import type { Controls } from '../../shared/types'

export function run(w: World, c: Controls, seconds: number, dt = 1 / 60): World {
  let s = w
  for (let i = 0; i < Math.round(seconds / dt); i++) s = simStep(s, c, dt)
  return s
}

describe('engine', () => {
  it('E1 stays put on the runway with no input', () => {
    const w = createWorld()
    const e = run(w, { roll: 0, pitch: 0, throttle: 0 }, 5)
    expect(e.ac.x).toBe(w.ac.x)
    expect(e.ac.y).toBe(w.ac.y)
    expect(e.simMs).toBeCloseTo(5000, 3)
  })
  it('E2 full throttle then rotate becomes airborne', () => {
    let w = run(createWorld(), { roll: 0, pitch: 0, throttle: 1 }, 25)
    w = run(w, { roll: 0, pitch: 1, throttle: 1 }, 3)
    w = run(w, { roll: 0, pitch: 0, throttle: 1 }, 12)
    expect(w.ac.onGround).toBe(false)
  })
})
