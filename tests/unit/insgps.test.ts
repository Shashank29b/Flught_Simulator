import { describe, expect, it } from 'vitest'
import { insErrorM, insInit, insStep } from '../../app/nav/ins'
import { gpsFix } from '../../app/nav/gps'
import { blendStep } from '../../app/nav/blend'
import { mulberry32 } from '../../shared/utils/random'

const zero = () => 0.5
describe('INS (§10)', () => {
  it('IN1 accelerometer bias 0.01 m/s² → 50 m error after 100 s', () => {
    let s = insInit({ bias: [0.01, 0], sigma: 0 })
    for (let i = 0; i < 10000; i++) s = insStep(s, 0.01, zero)
    expect(Math.abs(s.errX - 50)).toBeLessThan(0.6)
    expect(Math.abs(s.errY)).toBeLessThan(1e-9)
  })
  it('IN2 a perfect INS does not drift', () => {
    let s = insInit({ bias: [0, 0], sigma: 0 })
    for (let i = 0; i < 10000; i++) s = insStep(s, 0.01, zero)
    expect(insErrorM(s)).toBeLessThan(0.01)
  })
  it('the same seed gives the same drift', () => {
    const run = () => { let s = insInit(); const r = mulberry32(7); for (let i = 0; i < 2000; i++) s = insStep(s, 0.05, r); return s.errX }
    expect(run()).toBe(run())
  })
})

describe('GPS', () => {
  it('GS1 noise has mean ≈ 0 and sd ≈ 5 m', () => {
    const r = mulberry32(42)
    const xs = Array.from({ length: 1000 }, () => gpsFix(r, { outage: false })![0])
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length)
    expect(Math.abs(mean)).toBeLessThan(0.5)
    expect(sd).toBeGreaterThan(4.5)
    expect(sd).toBeLessThan(5.5)
  })
  it('GS2 outage gives no fix', () => expect(gpsFix(mulberry32(1), { outage: true })).toBeNull())
})

describe('INS/GPS blend', () => {
  function run(outageAfter = Infinity) {
    let ins = insInit({ bias: [0.01, 0], sigma: 0 })
    let est: [number, number] = [0, 0]
    for (let t = 1; t <= 300; t++) {
      for (let i = 0; i < 100; i++) ins = insStep(ins, 0.01, zero)
      est = blendStep(est, [ins.errX, ins.errY], t > outageAfter ? null : [0, 0], 0.3)
    }
    return { raw: insErrorM(ins), blended: Math.hypot(ins.errX - est[0], ins.errY - est[1]) }
  }
  it('BL1 perfect GPS at 1 Hz keeps the blended error small while the INS drifts', () => {
    const r = run()
    expect(r.raw).toBeGreaterThan(400)
    expect(r.blended).toBeLessThan(15)
  })
  it('during a GPS outage the blended position drifts again', () => {
    expect(run(200).blended).toBeGreaterThan(100)
  })
})
