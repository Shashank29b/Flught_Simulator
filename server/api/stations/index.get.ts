import { prisma } from '../../utils/prisma'
import { stationsQuery } from '../../validators/navdata'
import { listStations, listStationsInBbox } from '../../services/navdata'

/** ?bbox=s,w,n,e (map viewport) | ?near=lat,lon&radiusNm=200 (area) | neither: first 500 (optionally ?type=). */
export default defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, stationsQuery.parse)
  if (q.bbox) return listStationsInBbox(prisma, q.bbox)
  return listStations(prisma, { type: q.type, area: q.near ? { ...q.near, radiusNm: q.radiusNm } : undefined })
})
