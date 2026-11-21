import { prisma } from '../../utils/prisma'
import { requireUser } from '../../utils/auth'
import { startFlightSchema } from '../../validators/flights'
import { startFlight } from '../../services/flights'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, startFlightSchema.parse)
  const f = await startFlight(prisma, user.id, body.scenarioId)
  setResponseStatus(event, 201)
  return f
})
