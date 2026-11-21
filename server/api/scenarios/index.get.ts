import { prisma } from '../../utils/prisma'
import { listScenarios } from '../../services/scenarios'

export default defineEventHandler(() => listScenarios(prisma))
