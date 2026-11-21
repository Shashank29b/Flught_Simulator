import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, db: true }
  }
  catch {
    return { ok: true, db: false }
  }
})
