// End-to-end check of the main cockpit in headless Chrome. Usage: node tests/e2e/cockpit.mjs (server on BASE_URL)
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
const status = async () => (await page.locator('[data-test=status]').innerText()).replace(/\s+/g, ' ')
const num = async (label) => Number(new RegExp(`${label} (-?[\\d.]+)`).exec(await status())?.[1] ?? NaN)
async function waitFor(pred, ms, what) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (await pred()) return; await page.waitForTimeout(250) }
  throw new Error(`timeout waiting for ${what}; status: ${await status()}`)
}

await page.goto(`${BASE}/cockpit`)
await page.waitForTimeout(3000)

await check('cockpit loads on the runway', async () => {
  const s = await status()
  if (!s.includes('ON GROUND')) throw new Error(s)
})
await check('map shows India airports and nav aids', async () => {
  await waitFor(async () => (await page.locator('.leaflet-interactive').count()) > 10, 15000, 'nav aid layers')
  const info = await page.locator('text=/India · in this view: \\d+ airports/').innerText()
  if (!/India · in this view: \d+ airports/.test(info)) throw new Error(info)
})
await check('triple-tap on the airspeed indicator explains it', async () => {
  const asi = page.locator('[data-info=airspeed]')
  await asi.click({ clickCount: 3 })
  await page.getByRole('dialog', { name: 'Airspeed indicator (ASI)' }).waitFor({ timeout: 3000 })
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 3000 })
})
await check('ILS final preset: HSI in LOC mode, on localiser and glide slope', async () => {
  await page.getByRole('button', { name: 'ILS 09L final (8 NM)' }).click()
  await page.waitForTimeout(1000)
  const ils = await page.evaluate(() => window.useNuxtApp().$pinia.state.value.sim.world.nav.ils)
  if (!ils.locValid || !ils.gsValid || Math.abs(ils.locDevDeg) > 0.1 || Math.abs(ils.gsDevDeg) > 0.1) throw new Error(JSON.stringify(ils))
  await page.getByRole('button', { name: 'Runway 09L (take-off)' }).click()
  await page.waitForTimeout(500)
})
await check('throttle slider sets throttle', async () => {
  await page.locator('input[type=range]').fill('100')
  await waitFor(async () => (await num('THR')) === 100, 3000, 'THR 100')
})
await check('jet accelerates and takes off with S (stick back)', async () => {
  await waitFor(async () => (await num('IAS')) >= 150, 60000, 'IAS 150')
  await page.mouse.click(800, 980)
  await page.keyboard.down('s')
  await page.waitForTimeout(2500)
  await page.keyboard.up('s')
  await waitFor(async () => (await status()).includes('AIRBORNE'), 10000, 'airborne')
})
await check('keyboard D rolls right', async () => {
  await page.keyboard.down('d')
  await page.waitForTimeout(1000)
  await page.keyboard.up('d')
  if (!((await num('BANK')) > 8)) throw new Error(await status())
})
await check('preset "Airborne 6000 ft"', async () => {
  await page.getByRole('button', { name: 'Airborne 6000 ft' }).click()
  await page.waitForTimeout(500)
  const alt = await num('ALT')
  if (!(Math.abs(alt - 6000) < 50 && (await status()).includes('AIRBORNE'))) throw new Error(await status())
})
await check('on-screen Roll L button banks left', async () => {
  const b = page.getByRole('button', { name: '◀ Roll L (A)' })
  await b.hover()
  await page.mouse.down()
  await page.waitForTimeout(1000)
  await page.mouse.up()
  if (!((await num('BANK')) < -8)) throw new Error(await status())
})
await check('journey VOBL → VOMM: auto take-off and climb at 64×', async () => {
  const to = page.getByPlaceholder('ICAO, IATA, name or city').nth(1)
  await to.fill('VOMM')
  await page.getByRole('button', { name: /^VOMM/ }).first().click()
  await page.getByRole('button', { name: 'Start journey ▶' }).click()
  await page.getByRole('button', { name: '64', exact: true }).click()
  await waitFor(async () => (await status()).includes('AIRBORNE'), 20000, 'auto take-off')
  await waitFor(async () => (await page.locator('.bg-green-600', { hasText: /Climb|Cruise|Descent/ }).count()) > 0, 20000, 'climb phase')
})
await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '))
})
await page.screenshot({ path: process.env.SHOT ?? 'cockpit.png' })
await browser.close()
console.log(failed ? `${failed} check(s) failed` : 'ALL PASS')
process.exit(failed ? 1 : 0)
