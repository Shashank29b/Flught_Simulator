import type { Prisma, PrismaClient } from '@prisma/client'
import { createError } from 'h3'
import type { EndFlightInput, SampleInput } from '../validators/flights'
import { score } from './scoring.logic'
import { meanAbsLocFrac } from './flights.logic'

interface Actor { id: string; role: 'STUDENT' | 'ADMIN' }

async function ownedFlight(prisma: PrismaClient, user: Actor, id: string, allowAdmin = false) {
  const f = await prisma.flight.findUnique({ where: { id } })
  if (!f) throw createError({ statusCode: 404, statusMessage: 'Flight not found' })
  if (f.userId !== user.id && !(allowAdmin && user.role === 'ADMIN')) throw createError({ statusCode: 403, statusMessage: 'Not your flight' })
  return f
}

export async function startFlight(prisma: PrismaClient, userId: string, scenarioId: number): Promise<{ id: string }> {
  const s = await prisma.scenario.findUnique({ where: { id: scenarioId }, select: { id: true } })
  if (!s) throw createError({ statusCode: 404, statusMessage: 'Scenario not found' })
  const f = await prisma.flight.create({ data: { userId, scenarioId }, select: { id: true } })
  return f
}

export async function addSamples(prisma: PrismaClient, user: Actor, flightId: string, samples: SampleInput[]): Promise<{ count: number }> {
  const f = await ownedFlight(prisma, user, flightId)
  if (f.endedAt) throw createError({ statusCode: 409, statusMessage: 'Flight already ended' })
  const r = await prisma.flightSample.createMany({
    data: samples.map(s => ({ ...s, flightId, nav: s.nav as Prisma.InputJsonValue })),
  })
  return { count: r.count }
}

export async function endFlight(prisma: PrismaClient, user: Actor, flightId: string, body: EndFlightInput) {
  const f = await ownedFlight(prisma, user, flightId)
  if (f.endedAt) throw createError({ statusCode: 409, statusMessage: 'Flight already ended' })
  let landing
  if (body.result === 'LANDED' && body.landing) {
    const samples = await prisma.flightSample.findMany({ where: { flightId }, select: { x: true, nav: true } })
    landing = { ...body.landing, meanAbsLocFrac: meanAbsLocFrac(samples) }
  }
  const sc = score(body.result, landing)
  const [flight, saved] = await prisma.$transaction([
    prisma.flight.update({ where: { id: flightId }, data: { endedAt: new Date(), result: body.result } }),
    prisma.score.upsert({
      where: { flightId },
      create: { flightId, total: sc.total, details: sc.details },
      update: { total: sc.total, details: sc.details },
    }),
  ])
  return { flight, score: { total: saved.total, details: saved.details } }
}

export async function listFlights(prisma: PrismaClient, user: Actor, all: boolean) {
  const rows = await prisma.flight.findMany({
    where: all && user.role === 'ADMIN' ? undefined : { userId: user.id },
    orderBy: { startedAt: 'desc' },
    take: 200,
    include: { scenario: { select: { title: true } }, score: { select: { total: true } }, user: { select: { name: true } } },
  })
  return rows.map(f => ({
    id: f.id, scenarioId: f.scenarioId, scenarioTitle: f.scenario.title, userName: f.user.name,
    startedAt: f.startedAt, endedAt: f.endedAt, result: f.result, score: f.score?.total ?? null,
  }))
}

export async function getFlight(prisma: PrismaClient, user: Actor, id: string) {
  const f = await ownedFlight(prisma, user, id, true)
  const [scenario, samples, sc] = await Promise.all([
    prisma.scenario.findUnique({ where: { id: f.scenarioId }, select: { id: true, title: true, week: true } }),
    prisma.flightSample.findMany({ where: { flightId: id }, orderBy: { tMs: 'asc' }, select: { tMs: true, x: true, y: true, altFt: true, hdgDeg: true, iasKt: true, vsFpm: true, nav: true } }),
    prisma.score.findUnique({ where: { flightId: id }, select: { total: true, details: true } }),
  ])
  return { flight: f, scenario, samples, score: sc }
}
