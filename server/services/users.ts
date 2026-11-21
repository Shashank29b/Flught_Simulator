import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createError } from 'h3'

export interface PublicUser { id: string; name: string; email: string; role: 'STUDENT' | 'ADMIN' }

const pub = (u: PublicUser): PublicUser => ({ id: u.id, name: u.name, email: u.email, role: u.role })

export async function createUser(prisma: PrismaClient, input: { name: string; email: string; password: string }): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase()
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  const passwordHash = await bcrypt.hash(input.password, 10)
  return pub(await prisma.user.create({ data: { name: input.name.trim(), email, passwordHash } }))
}

export async function verifyLogin(prisma: PrismaClient, email: string, password: string): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (!u) return null
  return (await bcrypt.compare(password, u.passwordHash)) ? pub(u) : null
}
