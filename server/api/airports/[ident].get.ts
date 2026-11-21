import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { getAirport } from '../../services/navdata'

export default defineEventHandler(async (event) => {
  const { ident } = await getValidatedRouterParams(event, z.object({ ident: z.string().min(2).max(10) }).parse)
  const a = await getAirport(prisma, ident)
  if (!a) throw createError({ statusCode: 404, statusMessage: 'Airport not found' })
  return a
})
