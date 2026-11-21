import { prisma } from '../utils/prisma'
import { listAirports } from '../services/navdata'

export default defineEventHandler(() => listAirports(prisma))
