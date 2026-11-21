import { prisma } from '../../utils/prisma'
import { requireUser } from '../../utils/auth'
import { idParam } from '../../validators/flights'
import { getFlight } from '../../services/flights'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, idParam.parse)
  return getFlight(prisma, user, id)
})
