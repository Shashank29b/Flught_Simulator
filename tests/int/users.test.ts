import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createUser, verifyLogin } from '../../server/services/users'
import { prisma, resetDb } from './helpers'

describe('users service', () => {
  beforeEach(resetDb)
  afterAll(() => prisma.$disconnect())

  it('creates and verifies a user', async () => {
    const u = await createUser(prisma, { name: 'Ann', email: 'Ann@Example.com', password: 'password1' })
    expect(u.email).toBe('ann@example.com')
    expect(u).not.toHaveProperty('passwordHash')
    expect((await verifyLogin(prisma, 'ANN@example.com', 'password1'))?.id).toBe(u.id)
  })
  it('rejects a wrong password', async () => {
    await createUser(prisma, { name: 'Ann', email: 'a@b.co', password: 'password1' })
    expect(await verifyLogin(prisma, 'a@b.co', 'nope-nope')).toBeNull()
  })
  it('rejects duplicates with 409', async () => {
    await createUser(prisma, { name: 'Ann', email: 'a@b.co', password: 'password1' })
    await expect(createUser(prisma, { name: 'B', email: 'A@B.co', password: 'password2' })).rejects.toMatchObject({ statusCode: 409 })
  })
})
