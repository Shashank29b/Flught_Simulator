import { join } from 'node:path'
import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { airport, navaidStations, runways, scenarios, trainingIls, users, waypoints } from './seedData'
import { hasWorldData, loadWorld } from './world'

const prisma = new PrismaClient()
const DATA_DIR = join(process.cwd(), 'data', 'ourairports')

async function chunked<T>(rows: T[], size: number, fn: (part: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size))
}

async function main(): Promise<void> {
  // TRUNCATE … RESTART IDENTITY so ids are stable (scenario 1 is always "Free flight").
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Score", "FlightSample", "Flight", "Scenario", "Waypoint", "NavStation", "Runway", "Airport", "User" RESTART IDENTITY CASCADE',
  )

  if (hasWorldData(DATA_DIR)) {
    const w = loadWorld(DATA_DIR)
    await chunked(w.airports, 5000, part => prisma.airport.createMany({ data: part }))
    const ids = new Map((await prisma.airport.findMany({ select: { id: true, ident: true } })).map(a => [a.ident, a.id]))
    await chunked(w.runways, 5000, part => prisma.runway.createMany({
      data: part.flatMap(({ airportIdent, ...r }) => (ids.has(airportIdent) ? [{ ...r, airportId: ids.get(airportIdent)! }] : [])),
    }))
    await chunked(w.stations, 5000, part => prisma.navStation.createMany({ data: part }))
    console.log(`World data: ${w.airports.length} airports, ${w.runways.length} runway ends, ${w.stations.length} stations`)
  }
  else {
    const ap = await prisma.airport.create({ data: { ...airport, ident: 'VOBL', iata: 'BLR', type: 'large_airport', country: 'IN', municipality: 'Bengaluru' } })
    await prisma.runway.createMany({ data: runways.map(r => ({ ...r, airportId: ap.id })) })
    await prisma.navStation.createMany({ data: navaidStations.map(({ runwayIdent: _r, ...s }) => ({ ...s, country: 'IN' })) })
    console.log('World data not found (run scripts/data/download.sh); seeded VOBL only.')
  }

  // Training ILS for VOBL 09L/09R, linked to the runway rows.
  const vobl = await prisma.airport.findUnique({ where: { ident: 'VOBL' }, include: { runways: true } })
  if (!vobl) throw new Error('VOBL missing from the airport data')
  const rwyId = new Map(vobl.runways.map(r => [r.ident, r.id]))
  await prisma.navStation.createMany({
    data: trainingIls.map(({ runwayIdent, ...s }) => ({ ...s, country: 'IN', runwayId: runwayIdent ? rwyId.get(runwayIdent) ?? null : null })),
  })

  await prisma.waypoint.createMany({ data: waypoints })
  const hashed = await Promise.all(users.map(async u => ({ name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) })))
  await prisma.user.createMany({ data: hashed })
  for (const s of scenarios) {
    await prisma.scenario.create({ data: { ...s, config: s.config as unknown as Prisma.InputJsonValue } })
  }
  console.log(`Seeded ${trainingIls.length} training ILS/marker stations, ${waypoints.length} waypoints, ${scenarios.length} scenarios, ${users.length} users`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
