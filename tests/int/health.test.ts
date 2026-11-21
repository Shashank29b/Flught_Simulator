import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from './helpers'

describe('test database', () => {
  afterAll(() => prisma.$disconnect())
  it('answers SELECT 1', async () => {
    const r = await prisma.$queryRaw<{ v: number }[]>`SELECT 1 as v`
    expect(r[0]?.v).toBe(1)
  })
})
