import { describe, expect, it } from 'vitest'
import { ndProject } from '../../app/components/instruments/ndProject'

describe('ND projection (heading-up)', () => {
  it('a point ahead is straight up', () => {
    const [x, y] = ndProject({ x: 0, y: 10 }, { x: 0, y: 0 }, 0, 10, 100, 200)
    expect(x).toBeCloseTo(100, 9)
    expect(y).toBeCloseTo(100, 9)
  })
  it('heading east puts a northern point on the left', () => {
    const [x, y] = ndProject({ x: 0, y: 10 }, { x: 0, y: 0 }, 90, 10, 100, 200)
    expect(x).toBeCloseTo(0, 9)
    expect(y).toBeCloseTo(200, 9)
  })
})
