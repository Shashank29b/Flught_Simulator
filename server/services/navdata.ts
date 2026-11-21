import type { Prisma, PrismaClient, StationType } from '@prisma/client'

const RUNWAY_SELECT = { id: true, ident: true, headingDeg: true, thresholdLat: true, thresholdLon: true, lengthM: true, widthM: true } as const
const AIRPORT_SELECT = {
  id: true, ident: true, icao: true, iata: true, name: true, type: true, country: true, municipality: true,
  lat: true, lon: true, elevationFt: true, runways: { select: RUNWAY_SELECT },
} as const
const TYPE_RANK: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2 }

export interface Area { lat: number; lon: number; radiusNm: number }

/** Bounding box (flat-earth) for a radius in NM; good enough for prefiltering. */
export function bbox(a: Area): { latMin: number; latMax: number; lonMin: number; lonMax: number } {
  const dLat = a.radiusNm / 60
  const dLon = a.radiusNm / (60 * Math.max(0.05, Math.cos((a.lat * Math.PI) / 180)))
  return { latMin: a.lat - dLat, latMax: a.lat + dLat, lonMin: a.lon - dLon, lonMax: a.lon + dLon }
}

export function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 2 * 3440.065 * Math.asin(Math.min(1, Math.sqrt(a)))
}

function inBox(a: Area): Prisma.AirportWhereInput & Prisma.NavStationWhereInput {
  const b = bbox(a)
  return { lat: { gte: b.latMin, lte: b.latMax }, lon: { gte: b.lonMin, lte: b.lonMax } }
}

export async function listAirportsNear(prisma: PrismaClient, area: Area, limit = 300) {
  const rows = await prisma.airport.findMany({ where: inBox(area), select: AIRPORT_SELECT, take: 5000 })
  return rows
    .map(r => ({ r, d: distanceNm(area.lat, area.lon, r.lat, r.lon) }))
    .filter(x => x.d <= area.radiusNm)
    .sort((a, b) => (TYPE_RANK[a.r.type] ?? 3) - (TYPE_RANK[b.r.type] ?? 3) || a.d - b.d)
    .slice(0, limit)
    .map(x => x.r)
}

export async function searchAirports(prisma: PrismaClient, q: string, limit = 20) {
  const term = q.trim()
  const upper = term.toUpperCase()
  const rows = await prisma.airport.findMany({
    where: {
      OR: [
        { ident: upper }, { icao: upper }, { iata: upper },
        { name: { contains: term, mode: 'insensitive' } },
        { municipality: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: AIRPORT_SELECT,
    take: 200,
  })
  const exact = (r: { ident: string | null; icao: string | null; iata: string | null }) => (r.ident === upper || r.icao === upper || r.iata === upper ? 0 : 1)
  return rows.sort((a, b) => exact(a) - exact(b) || (TYPE_RANK[a.type] ?? 3) - (TYPE_RANK[b.type] ?? 3) || b.runways.length - a.runways.length).slice(0, limit)
}

export function getAirport(prisma: PrismaClient, ident: string) {
  return prisma.airport.findFirst({ where: { OR: [{ ident: ident.toUpperCase() }, { icao: ident.toUpperCase() }] }, select: AIRPORT_SELECT })
}

export async function listStations(prisma: PrismaClient, opts: { type?: StationType; area?: Area } = {}) {
  const rows = await prisma.navStation.findMany({
    where: { ...(opts.type ? { type: opts.type } : {}), ...(opts.area ? inBox(opts.area) : {}) },
    orderBy: { id: 'asc' },
    take: opts.area ? 5000 : 500,
    select: { id: true, type: true, ident: true, name: true, frequency: true, lat: true, lon: true, rangeNm: true, runwayId: true },
  })
  const area = opts.area
  return area ? rows.filter(r => distanceNm(area.lat, area.lon, r.lat, r.lon) <= area.radiusNm) : rows
}

export function listWaypoints(prisma: PrismaClient) {
  return prisma.waypoint.findMany({ orderBy: { id: 'asc' } })
}
