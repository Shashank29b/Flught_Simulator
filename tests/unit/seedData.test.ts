import { describe, expect, it } from 'vitest'
import { distNm, toLocal } from '../../shared/utils/geo'
import { runways, scenarios, stations, waypoints } from '../../prisma/seedData'

describe('VOBL seed data', () => {
  it('has the expected counts', () => {
    expect(runways.map(r => r.ident)).toEqual(['09L', '27R', '09R', '27L'])
    expect(stations.filter(s => s.type === 'VOR')).toHaveLength(7)
    expect(stations.filter(s => s.type === 'NDB')).toHaveLength(8)
    expect(stations.filter(s => s.type === 'ILS_LOC')).toHaveLength(2)
    expect(waypoints).toHaveLength(3)
    expect(scenarios).toHaveLength(9)
  })
  it('puts the local origin on the 09L threshold', () => {
    const t = toLocal({ lat: runways[0]!.thresholdLat, lon: runways[0]!.thresholdLon })
    expect(Math.hypot(t.x, t.y)).toBeLessThan(1e-9)
  })
  it('derives runway headings from the threshold coordinates', () => {
    expect(runways[0]!.headingDeg).toBeCloseTo(90.5, 0)
    expect(runways[1]!.headingDeg).toBeCloseTo(270.5, 0)
  })
  it('places the 09L LOC beyond the far end on the centreline', () => {
    const loc = stations.find(s => s.ident === 'IBLA' && s.type === 'ILS_LOC')!
    const far = toLocal({ lat: runways[1]!.thresholdLat, lon: runways[1]!.thresholdLon })
    expect(distNm(toLocal(loc), far)).toBeCloseTo(300 / 1852, 3)
  })
  it('places BBG about 15 NM south of the field', () => {
    const bbg = toLocal(stations.find(s => s.ident === 'BBG' && s.type === 'VOR')!)
    expect(bbg.y).toBeCloseTo(-15.45, 1)
  })
  it('only references existing runways and valid objectives', () => {
    const ids = new Set(runways.map(r => r.ident))
    for (const s of stations) if (s.runwayIdent) expect(ids.has(s.runwayIdent)).toBe(true)
    for (const s of scenarios) expect(['TRACK_RADIAL', 'REACH', 'LAND', 'ROUTE']).toContain(s.config.target.type)
  })
})
