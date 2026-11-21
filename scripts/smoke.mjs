// API smoke test. Usage: node scripts/smoke.mjs  (expects the server on BASE_URL)
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
let cookie = ''
let failed = 0
const ctx = {}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  })
  const set = res.headers.getSetCookie?.() ?? []
  if (set.length) cookie = set.map(c => c.split(';')[0]).join('; ')
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) }
  catch { /* not json */ }
  return { status: res.status, json, text }
}

async function check(name, fn) {
  try {
    await fn()
    console.log('PASS', name)
  }
  catch (e) {
    failed++
    console.log('FAIL', name, '-', e.message)
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// ---- W1-T02
await check('health db true', async () => {
  const r = await req('GET', '/api/health')
  assert(r.status === 200 && r.json?.db === true, JSON.stringify(r.json))
})

// ---- pages
for (const page of ['/']) {
  await check(`page ${page} 200`, async () => {
    const r = await req('GET', page)
    assert(r.status === 200, `status ${r.status}`)
  })
}

void ctx
if (failed) {
  console.log(`${failed} check(s) failed`)
  process.exit(1)
}
console.log('ALL PASS')
