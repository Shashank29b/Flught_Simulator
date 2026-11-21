import { prisma } from '../../../utils/prisma'
import { requireUser } from '../../../utils/auth'
import { endFlightSchema, idParam } from '../../../validators/flights'
import { endFlight } from '../../../services/flights'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const body = await readValidatedBody(event, endFlightSchema.parse)
  return endFlight(prisma, user, id, body)
})
