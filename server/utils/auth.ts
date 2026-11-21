import type { H3Event } from 'h3'
import type { User } from '#auth-utils'

export async function requireUser(event: H3Event): Promise<User> {
  const { user } = await requireUserSession(event)
  return user
}

export async function requireAdmin(event: H3Event): Promise<User> {
  const user = await requireUser(event)
  if (user.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  return user
}
