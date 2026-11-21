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
await check('map shows VOBL nav aids', async () => {
  await waitFor(async () => (await page.locator('.leaflet-interactive').count()) > 10, 10000, 'nav aid layers')
})
await check('throttle slider sets throttle', async () => {
  await page.locator('input[type=range]').fill('100')
  await waitFor(async () => (await num('THR')) === 100, 3000, 'THR 100')
})
await check('accelerates and takes off with ↓ (pitch up)', async () => {
  await waitFor(async () => (await num('IAS')) >= 70, 45000, 'IAS 70')
  await page.mouse.click(800, 980)
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(2500)
  await page.keyboard.up('ArrowDown')
  await waitFor(async () => (await status()).includes('AIRBORNE'), 10000, 'airborne')
})
await check('keyboard roll right banks the aircraft', async () => {
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(1000)
  await page.keyboard.up('ArrowRight')
  if (!((await num('BANK')) > 8)) throw new Error(await status())
})
await check('preset "Airborne 6000 ft"', async () => {
  await page.getByRole('button', { name: 'Airborne 6000 ft' }).click()
  await page.waitForTimeout(500)
  const alt = await num('ALT')
  if (!(Math.abs(alt - 6000) < 50 && (await status()).includes('AIRBORNE'))) throw new Error(await status())
})
await check('on-screen Roll L button banks left', async () => {
  const b = page.getByRole('button', { name: '◀ Roll L' })
  await b.hover()
  await page.mouse.down()
  await page.waitForTimeout(1000)
  await page.mouse.up()
  if (!((await num('BANK')) < -8)) throw new Error(await status())
})
await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '))
})
await page.screenshot({ path: process.env.SHOT ?? 'cockpit.png' })
await browser.close()
console.log(failed ? `${failed} check(s) failed` : 'ALL PASS')
process.exit(failed ? 1 : 0)
