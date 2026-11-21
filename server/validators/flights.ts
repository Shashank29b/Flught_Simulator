import { z } from 'zod'

export const idParam = z.object({ id: z.string().uuid() })
export const intIdParam = z.object({ id: z.coerce.number().int().positive() })

export const startFlightSchema = z.object({ scenarioId: z.number().int().positive() })

export const endFlightSchema = z.object({
  result: z.enum(['LANDED', 'CRASHED', 'COMPLETED', 'ABORTED']),
  landing: z.object({ lateralM: z.number().finite(), vsFpm: z.number().finite() }).optional(),
})

const num = z.number().finite()
export const sampleSchema = z.object({
  tMs: z.number().int().min(0),
  x: num, y: num, altFt: num, hdgDeg: num, iasKt: num, vsFpm: num,
  nav: z.object({ cdiDevDeg: num.optional(), locDevDeg: num.optional(), locFrac: num.optional(), gsDevDeg: num.optional(), dmeNm: num.optional() }),
})
export const samplesSchema = z.object({ samples: z.array(sampleSchema).min(1).max(100) })

export const listQuery = z.object({ all: z.enum(['0', '1']).optional() })

export type EndFlightInput = z.infer<typeof endFlightSchema>
export type SampleInput = z.infer<typeof sampleSchema>
