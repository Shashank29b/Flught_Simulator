import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { addSamples, endFlight, getFlight, listFlights, startFlight } from '../../server/services/flights'
import { getScenario, listScenarios } from '../../server/services/scenarios'
import { prisma, resetDb } from './helpers'

async function setup() {
  const sc = await prisma.scenario.create({ data: { title: 'T', description: 'd', week: 1, config: { startState: {}, target: { type: 'LAND', runwayIdent: '09' } } } })
  const a = await prisma.user.create({ data: { name: 'A', email: 'a@x.co', passwordHash: 'x' } })
  const b = await prisma.user.create({ data: { name: 'B', email: 'b@x.co', passwordHash: 'x' } })
  const admin = await prisma.user.create({ data: { name: 'Z', email: 'z@x.co', passwordHash: 'x', role: 'ADMIN' } })
  return { sc, a: { id: a.id, role: 'STUDENT' as const }, b: { id: b.id, role: 'STUDENT' as const }, admin: { id: admin.id, role: 'ADMIN' as const } }
}

const sample = (x: number, locFrac: number) => ({ tMs: 0, x, y: 0, altFt: 1000, hdgDeg: 90, iasKt: 100, vsFpm: -500, nav: { locFrac } })

describe('flights service', () => {
  beforeEach(resetDb)
  afterAll(() => prisma.$disconnect())

  it('lists and maps scenarios', async () => {
    const { sc } = await setup()
    expect(await listScenarios(prisma)).toHaveLength(1)
    const dto = await getScenario(prisma, sc.id)
    expect(dto.target.type).toBe('LAND')
    expect(dto.failures).toEqual([])
  })
  it('start → abort → score 0, double end 409', async () => {
    const { sc, a } = await setup()
    const f = await startFlight(prisma, a.id, sc.id)
    const r = await endFlight(prisma, a, f.id, { result: 'ABORTED' })
    expect(r.score.total).toBe(0)
    await expect(endFlight(prisma, a, f.id, { result: 'ABORTED' })).rejects.toMatchObject({ statusCode: 409 })
  })
  it('another user gets 403, admin can read', async () => {
    const { sc, a, b, admin } = await setup()
    const f = await startFlight(prisma, a.id, sc.id)
    await expect(endFlight(prisma, b, f.id, { result: 'ABORTED' })).rejects.toMatchObject({ statusCode: 403 })
    expect((await getFlight(prisma, admin, f.id)).flight.id).toBe(f.id)
  })
  it('samples feed the landing score; 409 after end', async () => {
    const { sc, a } = await setup()
    const f = await startFlight(prisma, a.id, sc.id)
    expect((await addSamples(prisma, a, f.id, [sample(-2, 0.2), sample(-1, -0.2)])).count).toBe(2)
    const r = await endFlight(prisma, a, f.id, { result: 'LANDED', landing: { lateralM: 20, vsFpm: -600 } })
    expect(r.score.total).toBe(69)
    await expect(addSamples(prisma, a, f.id, [sample(0, 0)])).rejects.toMatchObject({ statusCode: 409 })
    expect((await getFlight(prisma, a, f.id)).samples).toHaveLength(2)
  })
  it('lists newest first', async () => {
    const { sc, a } = await setup()
    const f1 = await startFlight(prisma, a.id, sc.id)
    await new Promise(r => setTimeout(r, 10))
    const f2 = await startFlight(prisma, a.id, sc.id)
    const l = await listFlights(prisma, a, false)
    expect(l.map(f => f.id)).toEqual([f2.id, f1.id])
  })
})
