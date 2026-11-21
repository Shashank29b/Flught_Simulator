import type { PrismaClient } from '@prisma/client'
import { createError } from 'h3'
import type { ScenarioConfig, ScenarioDTO } from '#shared/types'

export function listScenarios(prisma: PrismaClient) {
  return prisma.scenario.findMany({ orderBy: [{ week: 'asc' }, { id: 'asc' }], select: { id: true, title: true, description: true, week: true } })
}

export async function getScenario(prisma: PrismaClient, id: number): Promise<ScenarioDTO> {
  const s = await prisma.scenario.findUnique({ where: { id } })
  if (!s) throw createError({ statusCode: 404, statusMessage: 'Scenario not found' })
  const c = s.config as unknown as ScenarioConfig
  return {
    id: s.id, title: s.title, description: s.description, week: s.week,
    startState: c.startState ?? {}, target: c.target, wind: c.wind ?? null,
    failures: c.failures ?? [], traffic: c.traffic ?? [], radios: c.radios ?? {},
    atmosphere: c.atmosphere ?? { qnhHpa: 1013.25, isaDevC: 0 },
  }
}
