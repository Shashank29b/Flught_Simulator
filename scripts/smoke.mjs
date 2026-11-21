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

// ---- W1-T07
await check('airports has XTRN', async () => {
  const r = await req('GET', '/api/airports')
  assert(r.status === 200 && r.json?.some(a => a.icao === 'XTRN'), JSON.stringify(r.json).slice(0, 200))
})
await check('stations >= 10', async () => {
  const r = await req('GET', '/api/stations')
  assert(r.status === 200 && r.json?.length >= 10, `len ${r.json?.length}`)
})
await check('stations ?type=NDB', async () => {
  const r = await req('GET', '/api/stations?type=NDB')
  assert(r.status === 200 && r.json?.length === 1, `len ${r.json?.length}`)
})

// ---- W2-T11 auth
const email = `smoke${Date.now()}@test.local`
ctx.email = email
await check('register', async () => {
  const r = await req('POST', '/api/auth/register', { name: 'Smoke', email, password: 'smokepass1' })
  assert(r.status === 201 && r.json?.user?.email === email, `${r.status} ${r.text.slice(0, 120)}`)
})
await check('me after register', async () => {
  const r = await req('GET', '/api/auth/me')
  assert(r.status === 200, `status ${r.status}`)
})
await check('logout then me 401', async () => {
  await req('POST', '/api/auth/logout')
  const r = await req('GET', '/api/auth/me')
  assert(r.status === 401, `status ${r.status}`)
})
await check('wrong password 401', async () => {
  const r = await req('POST', '/api/auth/login', { email, password: 'wrongpass1' })
  assert(r.status === 401, `status ${r.status}`)
})
await check('login', async () => {
  const r = await req('POST', '/api/auth/login', { email, password: 'smokepass1' })
  assert(r.status === 200, `status ${r.status}`)
  assert((await req('GET', '/api/auth/me')).status === 200, 'me failed')
})

// ---- W2-T13 scenarios + flights
await check('scenarios >= 9', async () => {
  const r = await req('GET', '/api/scenarios')
  assert(r.status === 200 && r.json?.length >= 9, `len ${r.json?.length}`)
  ctx.scenarioId = r.json[0].id
})
await check('scenario has config', async () => {
  const r = await req('GET', `/api/scenarios/${ctx.scenarioId}`)
  assert(r.status === 200 && r.json?.target?.type, r.text.slice(0, 120))
})
await check('start → abort → score 0 → 409', async () => {
  const s = await req('POST', '/api/flights', { scenarioId: ctx.scenarioId })
  assert(s.status === 201 && s.json?.id, `start ${s.status}`)
  const e = await req('PATCH', `/api/flights/${s.json.id}/end`, { result: 'ABORTED' })
  assert(e.status === 200 && e.json?.score?.total === 0, `end ${e.status}`)
  const e2 = await req('PATCH', `/api/flights/${s.json.id}/end`, { result: 'ABORTED' })
  assert(e2.status === 409, `second end ${e2.status}`)
})
await check('flights list', async () => {
  const r = await req('GET', '/api/flights')
  assert(r.status === 200 && r.json?.length >= 1, `len ${r.json?.length}`)
})

// ---- pages
for (const page of ['/', '/login', '/register', '/scenarios', '/flights', '/fly/1', '/fly/2']) {
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
