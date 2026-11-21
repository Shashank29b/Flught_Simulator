import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { airport, runway, scenarios, stations, users, waypoints } from './seedData'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const hashed = await Promise.all(users.map(async u => ({ name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) })))
  await prisma.$transaction(async (tx) => {
    await tx.score.deleteMany()
    await tx.flightSample.deleteMany()
    await tx.flight.deleteMany()
    await tx.scenario.deleteMany()
    await tx.waypoint.deleteMany()
    await tx.navStation.deleteMany()
    await tx.runway.deleteMany()
    await tx.airport.deleteMany()
    await tx.user.deleteMany()

    const ap = await tx.airport.create({ data: airport })
    const rwy = await tx.runway.create({ data: { ...runway, airportId: ap.id } })
    await tx.navStation.createMany({
      data: stations.map(({ onRunway, ...s }) => ({ ...s, runwayId: onRunway ? rwy.id : null })),
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
