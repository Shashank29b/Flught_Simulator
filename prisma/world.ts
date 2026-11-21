/**
 * Converts the OurAirports CSVs (public domain, https://ourairports.com/data/) into seed rows.
 * Airports: large/medium/small (open). Runways: both ends surveyed, open. Navaids: VOR, VOR-DME, VORTAC, DME, NDB, NDB-DME.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bearingDeg, distNm, toLocal } from '../shared/utils/geo'
import type { StationType } from '../shared/types'
import { parseCsv } from './csv'

export interface AirportRow { ident: string; icao: string | null; iata: string | null; name: string; type: string; country: string | null; municipality: string | null; lat: number; lon: number; elevationFt: number }
export interface RunwayRow { airportIdent: string; ident: string; headingDeg: number; thresholdLat: number; thresholdLon: number; lengthM: number; widthM: number }
export interface StationRow { type: StationType; ident: string; name: string; frequency: number; lat: number; lon: number; rangeNm: number; country: string | null }

const AIRPORT_TYPES = new Set(['large_airport', 'medium_airport', 'small_airport'])
const num = (v: string | undefined): number | null => (v === undefined || v.trim() === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
const str = (v: string | undefined): string | null => (v && v.trim() !== '' ? v.trim() : null)

export function hasWorldData(dir: string): boolean {
  return ['airports', 'runways', 'navaids'].every(f => existsSync(join(dir, `${f}.csv`)))
}

export function mapAirports(rows: Record<string, string>[]): AirportRow[] {
  const seenIcao = new Set<string>()
  const out: AirportRow[] = []
  for (const r of rows) {
    if (!AIRPORT_TYPES.has(r.type ?? '')) continue
    const lat = num(r.latitude_deg)
    const lon = num(r.longitude_deg)
    if (lat === null || lon === null || !r.ident) continue
    let icao = str(r.icao_code) ?? (r.type !== 'small_airport' && /^[A-Z]{4}$/.test(r.ident) ? r.ident : null)
    if (icao && seenIcao.has(icao)) icao = null
    if (icao) seenIcao.add(icao)
    out.push({
      ident: r.ident, icao, iata: str(r.iata_code), name: r.name ?? r.ident, type: r.type ?? 'small_airport',
      country: str(r.iso_country), municipality: str(r.municipality), lat, lon, elevationFt: Math.round(num(r.elevation_ft) ?? 0),
    })
  }
  return out
}

export function mapRunways(rows: Record<string, string>[], airportIdents: Set<string>): RunwayRow[] {
  const out: RunwayRow[] = []
  for (const r of rows) {
    if (r.closed === '1' || !airportIdents.has(r.airport_ident ?? '')) continue
    const le = { lat: num(r.le_latitude_deg), lon: num(r.le_longitude_deg) }
    const he = { lat: num(r.he_latitude_deg), lon: num(r.he_longitude_deg) }
    if (le.lat === null || le.lon === null || he.lat === null || he.lon === null) continue
    const leLL = { lat: le.lat, lon: le.lon }
    const heLL = { lat: he.lat, lon: he.lon }
    const a = toLocal(leLL, leLL)
    const b = toLocal(heLL, leLL)
    const geomNm = distNm(a, b)
    if (geomNm < 0.05) continue
    const lengthM = Math.round((num(r.length_ft) ?? geomNm * 6076.12) * 0.3048)
    const widthM = Math.round((num(r.width_ft) ?? 100) * 0.3048)
    const hdg = Math.round(bearingDeg(a, b) * 10) / 10
    const airportIdent = r.airport_ident!
    out.push({ airportIdent, ident: r.le_ident || 'LE', headingDeg: hdg, thresholdLat: le.lat, thresholdLon: le.lon, lengthM, widthM })
    out.push({ airportIdent, ident: r.he_ident || 'HE', headingDeg: Math.round(((hdg + 180) % 360) * 10) / 10, thresholdLat: he.lat, thresholdLon: he.lon, lengthM, widthM })
  }
  return out
}

function vorRange(usage: string): number {
  return usage === 'TERMINAL' ? 40 : usage === 'LO' ? 80 : 130
}
function ndbRange(power: string): number {
  return power === 'LOW' ? 25 : power === 'HIGH' ? 75 : 50
}

export function mapNavaids(rows: Record<string, string>[]): StationRow[] {
  const out: StationRow[] = []
  for (const r of rows) {
    const lat = num(r.latitude_deg)
    const lon = num(r.longitude_deg)
    const khz = num(r.frequency_khz)
    if (lat === null || lon === null || khz === null || !r.ident) continue
    const base = { ident: r.ident, lat, lon, country: str(r.iso_country) }
    const name = `${r.name ?? r.ident} ${r.type}`
    const mhz = Math.round(khz) / 1000
    switch (r.type) {
      case 'VOR':
        out.push({ ...base, type: 'VOR', name, frequency: mhz, rangeNm: vorRange(r.usageType ?? '') })
        break
      case 'VOR-DME':
      case 'VORTAC':
        out.push({ ...base, type: 'VOR', name, frequency: mhz, rangeNm: vorRange(r.usageType ?? '') })
        out.push({ ...base, type: 'DME', name, frequency: mhz, rangeNm: vorRange(r.usageType ?? '') })
        break
      case 'DME':
        if (khz >= 108000 && khz <= 117950) out.push({ ...base, type: 'DME', name, frequency: mhz, rangeNm: vorRange(r.usageType ?? '') })
        break
      case 'NDB':
      case 'NDB-DME':
        if (khz >= 190 && khz <= 1750) out.push({ ...base, type: 'NDB', name, frequency: khz, rangeNm: ndbRange(r.power ?? '') })
        break
    }
  }
  return out
}

export function loadWorld(dir: string): { airports: AirportRow[]; runways: RunwayRow[]; stations: StationRow[] } {
  const read = (f: string) => parseCsv(readFileSync(join(dir, `${f}.csv`), 'utf8'))
  const airports = mapAirports(read('airports'))
  const runways = mapRunways(read('runways'), new Set(airports.map(a => a.ident)))
  const stations = mapNavaids(read('navaids'))
  return { airports, runways, stations }
}
