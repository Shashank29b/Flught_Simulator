import { prisma } from '../../../utils/prisma'
import { requireUser } from '../../../utils/auth'
import { idParam, samplesSchema } from '../../../validators/flights'
import { addSamples } from '../../../services/flights'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  const body = await readValidatedBody(event, samplesSchema.parse)
  return addSamples(prisma, user, id, body.samples)
})
