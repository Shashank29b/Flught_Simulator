import { prisma } from '../../utils/prisma'
import { stationsQuery } from '../../validators/navdata'
import { listStations } from '../../services/navdata'

/** ?near=lat,lon&radiusNm=200 for an area; without near, returns at most 500 rows (optionally ?type=). */
export default defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, stationsQuery.parse)
  return listStations(prisma, { type: q.type, area: q.near ? { ...q.near, radiusNm: q.radiusNm } : undefined })
})
