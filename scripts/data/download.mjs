// Downloads the OurAirports world dataset (public domain) into data/ourairports/.
// Cross-platform (Windows, macOS, Linux, Docker): `node scripts/data/download.mjs` or `npm run data:download`.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'ourairports')
const BASE = 'https://davidmegginson.github.io/ourairports-data'
await mkdir(dir, { recursive: true })
for (const f of ['airports', 'runways', 'navaids']) {
  const res = await fetch(`${BASE}/${f}.csv`)
  if (!res.ok) throw new Error(`download of ${f}.csv failed: HTTP ${res.status}`)
  const text = await res.text()
  await writeFile(join(dir, `${f}.csv`), text)
  console.log(`downloaded ${f}.csv (${text.split('\n').length - 1} lines)`)
}
console.log(`saved to ${dir}`)
