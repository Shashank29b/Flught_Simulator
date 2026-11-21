import { prisma } from '../../utils/prisma'
import { requireUser } from '../../utils/auth'
import { listQuery } from '../../validators/flights'
import { listFlights } from '../../services/flights'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const q = await getValidatedQuery(event, listQuery.parse)
  return listFlights(prisma, user, q.all === '1')
})
