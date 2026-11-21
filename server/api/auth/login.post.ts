import { prisma } from '../../utils/prisma'
import { loginSchema } from '../../validators/auth'
import { verifyLogin } from '../../services/users'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const user = await verifyLogin(prisma, body.email, body.password)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  await setUserSession(event, { user })
  return { user }
})
