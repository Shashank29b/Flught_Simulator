import { describe, expect, it } from 'vitest'
import { toLocal } from '../../shared/utils/geo'
import { scenarios, stations, waypoints } from '../../prisma/seedData'

describe('seed data', () => {
  it('has the expected counts', () => {
    expect(stations).toHaveLength(10)
    expect(waypoints).toHaveLength(3)
    expect(scenarios).toHaveLength(9)
  })
  it('places TRN at local (2, 6)', () => {
    const trn = stations.find(s => s.type === 'VOR' && s.ident === 'TRN')!
    const v = toLocal(trn)
    expect(v.x).toBeCloseTo(2, 6)
    expect(v.y).toBeCloseTo(6, 6)
  })
  it('links the ILS to the runway', () => {
    expect(stations.find(s => s.type === 'ILS_LOC')?.onRunway).toBe(true)
  })
  it('has valid objective types', () => {
    for (const s of scenarios) expect(['TRACK_RADIAL', 'REACH', 'LAND', 'ROUTE']).toContain(s.config.target.type)
  })
})
