import { describe, expect, it } from 'vitest'
import { mapAirports, mapNavaids, mapRunways } from '../../prisma/world'

describe('OurAirports mapping', () => {
  it('keeps open airports and drops heliports/closed', () => {
    const a = mapAirports([
      { ident: 'VOBL', type: 'large_airport', name: 'Kempegowda', latitude_deg: '13.19', longitude_deg: '77.70', elevation_ft: '3000', icao_code: 'VOBL', iata_code: 'BLR', iso_country: 'IN', municipality: 'Bangalore' },
      { ident: 'IN-0001', type: 'heliport', name: 'H', latitude_deg: '1', longitude_deg: '1' },
      { ident: 'XXXX', type: 'closed', name: 'C', latitude_deg: '1', longitude_deg: '1' },
    ])
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ ident: 'VOBL', icao: 'VOBL', iata: 'BLR', elevationFt: 3000 })
  })
  it('creates one row per runway end with headings from coordinates', () => {
    const r = mapRunways([{ airport_ident: 'VOBL', closed: '0', le_ident: '09L', le_latitude_deg: '13.207164', le_longitude_deg: '77.686073', he_ident: '27R', he_latitude_deg: '13.206847', he_longitude_deg: '77.722969', length_ft: '13123', width_ft: '148' }], new Set(['VOBL']))
    expect(r.map(x => x.ident)).toEqual(['09L', '27R'])
    expect(r[0]!.headingDeg).toBeCloseTo(90.5, 0)
    expect(r[1]!.headingDeg).toBeCloseTo(270.5, 0)
    expect(r[0]!.lengthM).toBe(4000)
  })
  it('splits VOR-DME and converts frequencies', () => {
    const n = mapNavaids([
      { ident: 'BBG', type: 'VOR-DME', frequency_khz: '115500', latitude_deg: '12.9', longitude_deg: '77.6', name: 'Bangalore', usageType: 'BOTH' },
      { ident: 'YH', type: 'NDB', frequency_khz: '223', latitude_deg: '13.1', longitude_deg: '77.6', name: 'Yelahanka', power: 'LOW' },
      { ident: 'TCN', type: 'TACAN', frequency_khz: '', latitude_deg: '1', longitude_deg: '1', name: 'Mil' },
    ])
    expect(n.map(s => `${s.type}:${s.frequency}`)).toEqual(['VOR:115.5', 'DME:115.5', 'NDB:223'])
    expect(n[2]!.rangeNm).toBe(25)
  })
})
