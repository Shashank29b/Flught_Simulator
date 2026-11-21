import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { airport, runways, scenarios, stations, users, waypoints } from './seedData'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const hashed = await Promise.all(users.map(async u => ({ name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) })))
  await prisma.$transaction(async (tx) => {
    // TRUNCATE … RESTART IDENTITY so ids are stable (scenario 1 is always "Free flight").
    await tx.$executeRawUnsafe(
      'TRUNCATE "Score", "FlightSample", "Flight", "Scenario", "Waypoint", "NavStation", "Runway", "Airport", "User" RESTART IDENTITY CASCADE',
    )

    const ap = await tx.airport.create({ data: airport })
    const ids = new Map<string, number>()
    for (const r of runways) ids.set(r.ident, (await tx.runway.create({ data: { ...r, airportId: ap.id } })).id)
    await tx.navStation.createMany({
      data: stations.map(({ runwayIdent, ...s }) => ({ ...s, runwayId: runwayIdent ? ids.get(runwayIdent) ?? null : null })),
    })
    await tx.waypoint.createMany({ data: waypoints })
    await tx.user.createMany({ data: hashed })
    for (const s of scenarios) {
      await tx.scenario.create({ data: { ...s, config: s.config as unknown as Prisma.InputJsonValue } })
    }
  })
  console.log(`Seeded: ${stations.length} stations, ${waypoints.length} waypoints, ${scenarios.length} scenarios, ${users.length} users`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
