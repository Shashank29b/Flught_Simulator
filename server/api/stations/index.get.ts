import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { listStations } from '../../services/navdata'

const querySchema = z.object({
  type: z.enum(['VOR', 'DVOR', 'DME', 'NDB', 'ILS_LOC', 'ILS_GS', 'MARKER_OM', 'MARKER_MM', 'MARKER_IM']).optional(),
})

export default defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, querySchema.parse)
  return listStations(prisma, q.type)
})
