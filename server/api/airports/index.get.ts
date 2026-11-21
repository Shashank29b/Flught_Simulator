import { prisma } from '../../utils/prisma'
import { airportsQuery } from '../../validators/navdata'
import { listAirportsInBbox, listAirportsNear, searchAirports } from '../../services/navdata'

/**
 * ?q=bengaluru                        search (ident/ICAO/IATA/name/city)
 * ?bbox=s,w,n,e&types=a,b&limit=N     map viewport (runways included only when limit ≤ 600)
 * ?near=lat,lon&radiusNm=100          area around a point (defaults to VOBL)
 */
export default defineEventHandler(async (event) => {
  const q = await getValidatedQuery(event, airportsQuery.parse)
  if (q.q) return searchAirports(prisma, q.q, Math.min(q.limit, 50))
  if (q.bbox) return listAirportsInBbox(prisma, q.bbox, q.types?.split(',').filter(Boolean), q.limit, q.limit <= 600)
  const near = q.near ?? { lat: 13.1979, lon: 77.706299 }
  return listAirportsNear(prisma, { ...near, radiusNm: q.radiusNm }, Math.min(q.limit, 500))
})
