import { execSync } from 'node:child_process'
import { testDbUrl } from './env'

export default function setup(): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDbUrl() },
    stdio: 'pipe',
  })
}
