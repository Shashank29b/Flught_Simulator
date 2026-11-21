import { z } from 'zod'

const latLon = z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).transform((s) => {
  const [lat, lon] = s.split(',').map(Number) as [number, number]
  return { lat, lon }
}).refine(p => Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180, 'out of range')

const bboxStr = z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/).transform((s) => {
  const [south, west, north, east] = s.split(',').map(Number) as [number, number, number, number]
  return { south, west, north, east }
})

export const airportsQuery = z.object({
  bbox: bboxStr.optional(),
  types: z.string().regex(/^[a-z_,]+$/).optional(),
  q: z.string().trim().min(2).max(60).optional(),
  near: latLon.optional(),
  radiusNm: z.coerce.number().min(1).max(300).default(100),
  limit: z.coerce.number().int().min(1).max(3000).default(300),
})

export const stationsQuery = z.object({
  bbox: bboxStr.optional(),
  type: z.enum(['VOR', 'DVOR', 'DME', 'NDB', 'ILS_LOC', 'ILS_GS', 'MARKER_OM', 'MARKER_MM', 'MARKER_IM']).optional(),
  near: latLon.optional(),
  radiusNm: z.coerce.number().min(1).max(400).default(200),
})
