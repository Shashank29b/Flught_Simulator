import { readFileSync } from 'node:fs'

/** Reads TEST_DATABASE_URL from the environment or .env. */
export function testDbUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  const line = readFileSync('.env', 'utf8').split('\n').find(l => l.startsWith('TEST_DATABASE_URL='))
  if (!line) throw new Error('TEST_DATABASE_URL missing')
  return line.slice('TEST_DATABASE_URL='.length).trim()
}
