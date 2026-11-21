import { describe, expect, it } from 'vitest'
import { tapeTicks } from '../../app/components/instruments/pfdDraw'

describe('PFD tape ticks', () => {
  it('speed tape around 123 kt (10 kt steps, ±40)', () => expect(tapeTicks(123, 10, 40)).toEqual([90, 100, 110, 120, 130, 140, 150, 160]))
  it('altitude tape around 3450 ft (100 ft steps, ±400)', () => {
    const t = tapeTicks(3450, 100, 400)
    expect(t[0]).toBe(3100)
    expect(t.at(-1)).toBe(3800)
  })
  it('heading tape wraps through 0 (values may go negative; labels are wrapped when drawn)', () => expect(tapeTicks(2, 5, 10)).toEqual([-5, 0, 5, 10]))
})
