import { PrismaClient } from '@prisma/client'
import { testDbUrl } from './env'

export const prisma = new PrismaClient({ datasources: { db: { url: testDbUrl() } } })

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Score", "FlightSample", "Flight", "Scenario", "Waypoint", "NavStation", "Runway", "Airport", "User" RESTART IDENTITY CASCADE',
  )
}
