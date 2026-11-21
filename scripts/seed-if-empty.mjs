// Container start-up: seed the database automatically the first time (when it has no airports yet).
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  const n = await prisma.airport.count()
  if (n > 0) console.log(`Database already seeded (${n} airports).`)
  else {
    console.log('Empty database: seeding (world airports, runways, nav aids, users, scenarios)…')
    execSync('npx prisma db seed', { stdio: 'inherit' })
  }
}
finally {
  await prisma.$disconnect()
}
