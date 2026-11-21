import { prisma } from '../../utils/prisma'
import { registerSchema } from '../../validators/auth'
import { createUser } from '../../services/users'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)
  const user = await createUser(prisma, body)
  await setUserSession(event, { user })
  setResponseStatus(event, 201)
  return { user }
})
