import { prisma } from '../../utils/prisma'
import { airportsQuery } from '../../validators/navdata'
import { listAirportsNear, searchAirports } from '../../services/navdata'

/** ?q=bengaluru (search) or ?near=lat,lon&radiusNm=100 (area; defaults to VOBL). */
export default defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, airportsQuery.parse)
  if (q.q) return searchAirports(prisma, q.q, Math.min(q.limit, 50))
  const near = q.near ?? { lat: 13.1979, lon: 77.706299 }
  return listAirportsNear(prisma, { ...near, radiusNm: q.radiusNm }, q.limit)
})
