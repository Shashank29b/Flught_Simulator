import { describe, expect, it } from 'vitest'
import { makeSample } from '../../app/composables/useRecorder'
import { createWorld, rebaseWorld } from '../../app/sim/engine'
import { toLatLon } from '../../shared/utils/geo'
import { air } from './helpers/fixtures'

describe('recorder sample', () => {
  it('stores positions in the fixed VOBL frame, even after re-centring', () => {
    const w = createWorld({ ac: air({ x: 45, y: 3 }) })
    const r = rebaseWorld(w, toLatLon(w.ac, w.ref))
    const a = makeSample(w)
    const b = makeSample(r)
    expect(b.x).toBeCloseTo(a.x, 6)
    expect(b.y).toBeCloseTo(a.y, 6)
  })
  it('only includes valid nav values', () => {
    const s = makeSample(createWorld({ ac: air() }))
    expect(s.nav).toEqual({})
  })
})
