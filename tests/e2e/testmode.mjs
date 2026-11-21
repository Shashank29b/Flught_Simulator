// Test-mode flow in headless Chrome: login → ILS scenario → short final → touchdown → score → replay.
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
let failed = 0
const check = async (name, fn) => {
  try { await fn(); console.log('PASS', name) }
  catch (e) { failed++; console.log('FAIL', name, '-', e.message) }
}

await check('login', async () => {
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(2500)
  await page.fill('input[type=email]', 'student@skynav.local')
  await page.fill('input[type=password]', 'student1234')
  await page.click('button:has-text("Log in")')
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 15000 })
})
await check('ILS scenario lands from short final and is scored', async () => {
  const list = await (await page.request.get(`${BASE}/api/scenarios`)).json()
  const ils = list.find(s => s.title.startsWith('ILS approach 09L'))
  await page.goto(`${BASE}/fly/${ils.id}`)
  await page.waitForTimeout(4000)
  // put the trainer on a stable short final: 0.25 NM before the 09L threshold, 80 ft up, gear down
  await page.evaluate(() => {
    const s = window.useNuxtApp().$pinia._s.get('sim')
    const w = s.world
    s.world = { ...w, ac: { ...w.ac, x: -0.25, y: 0.002, altFt: 3080, hdgDeg: 90.5, iasKt: 75, throttle: 0.3, pitchDeg: -2.5, bankDeg: 0, gearDown: true, flapsDeg: 30, onGround: false } }
  })
  await page.getByText('Score:').waitFor({ timeout: 30000 })
  await page.waitForTimeout(2000)
  const banner = await page.locator('text=/LANDED|CRASHED/').first().innerText()
  if (!banner.includes('LANDED')) throw new Error(banner)
})
await check('flight log lists it and the replay shows the score', async () => {
  const flights = await (await page.request.get(`${BASE}/api/flights`)).json()
  const f = flights[0]
  if (f.result !== 'LANDED' || !(f.score > 0)) throw new Error(JSON.stringify(f))
  await page.goto(`${BASE}/flights/${f.id}`)
  await page.getByText('Score breakdown').waitFor({ timeout: 10000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: process.env.SHOT ?? 'replay.png' })
})
await check('no page errors', async () => { if (errors.length) throw new Error(errors.slice(0, 3).join(' | ')) })
await browser.close()
console.log(failed ? `${failed} check(s) failed` : 'ALL PASS')
process.exit(failed ? 1 : 0)
