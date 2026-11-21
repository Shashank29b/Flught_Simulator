import { prisma } from '../../utils/prisma'
import { intIdParam } from '../../validators/flights'
import { getScenario } from '../../services/scenarios'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, intIdParam.parse)
  return getScenario(prisma, id)
})
