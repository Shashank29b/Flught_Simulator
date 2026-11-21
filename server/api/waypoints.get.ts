import { prisma } from '../utils/prisma'
import { listWaypoints } from '../services/navdata'

export default defineEventHandler(() => listWaypoints(prisma))
