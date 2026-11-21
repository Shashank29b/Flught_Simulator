import type { PrismaClient, StationType } from '@prisma/client'

export function listAirports(prisma: PrismaClient) {
  return prisma.airport.findMany({
    orderBy: { id: 'asc' },
    include: { runways: { select: { id: true, ident: true, headingDeg: true, thresholdLat: true, thresholdLon: true, lengthM: true, widthM: true } } },
  })
}

export function listStations(prisma: PrismaClient, type?: StationType) {
  return prisma.navStation.findMany({
    where: type ? { type } : undefined,
    orderBy: { id: 'asc' },
    select: { id: true, type: true, ident: true, name: true, frequency: true, lat: true, lon: true, rangeNm: true, runwayId: true },
  })
}

export function listWaypoints(prisma: PrismaClient) {
  return prisma.waypoint.findMany({ orderBy: { id: 'asc' } })
}
