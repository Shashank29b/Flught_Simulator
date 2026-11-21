import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, step } from '../../app/sim/flightModel'
import type { AircraftState, Controls, Wind } from '../../shared/types'

const AIR: AircraftState = { ...DEFAULT_STATE, onGround: false, gearDown: false, altFt: 3900, iasKt: 120, throttle: 120 / 140, hdgDeg: 90 }
const hold = (throttle: number): Controls => ({ roll: 0, pitch: 0, throttle })

function runFor(s: AircraftState, c: Controls, wind: Wind | null, seconds: number, dt = 1 / 60): AircraftState {
  let st = s
  for (let i = 0; i < Math.round(seconds / dt); i++) st = step(st, c, wind, dt)
  return st
}

describe('flight model', () => {
  it('F1 straight and level 60 s at 120 kt', () => {
    const e = runFor(AIR, hold(120 / 140), null, 60)
    expect(e.x - AIR.x).toBeCloseTo(2, 1)
    expect(Math.abs(e.x - AIR.x - 2)).toBeLessThan(0.01)
    expect(Math.abs(e.y - AIR.y)).toBeLessThan(0.01)
    expect(Math.abs(e.altFt - AIR.altFt)).toBeLessThan(1)
  })
  it('F2 standard-rate turn', () => {
    const s = { ...AIR, iasKt: 100, throttle: 100 / 140, bankDeg: 15, hdgDeg: 0 }
    const e = runFor(s, hold(100 / 140), null, 1)
    expect(Math.abs(e.hdgDeg - 2.93)).toBeLessThan(0.05)
  })
  it('F3 climb rate from pitch', () => {
    const e = step({ ...AIR, pitchDeg: 5 }, hold(120 / 140), null, 1 / 60)
    expect(Math.abs(e.vsFpm - 1059)).toBeLessThan(5)
  })
  it('F4 wind triangle', () => {
    const e = step({ ...AIR, hdgDeg: 0, iasKt: 100 }, hold(100 / 140), { fromDeg: 270, speedKt: 20 }, 1 / 60)
    expect(Math.abs(e.trackDeg - 11.31)).toBeLessThan(0.1)
    expect(Math.abs(e.gsKt - 101.98)).toBeLessThan(0.1)
  })
  it('F5 no rotation below 65 kt', () => {
    const s = { ...DEFAULT_STATE, iasKt: 50, throttle: 50 / 140 }
    const e = runFor(s, { roll: 0, pitch: 1, throttle: 50 / 140 }, null, 2)
    expect(e.onGround).toBe(true)
    expect(e.pitchDeg).toBe(0)
  })
  it('F6 bank clamps at 35', () => {
    const e = runFor(AIR, { roll: 1, pitch: 0, throttle: 120 / 140 }, null, 5)
    expect(e.bankDeg).toBe(35)
  })
  it('F7 speed lag', () => {
    const e = runFor({ ...AIR, iasKt: 50 }, hold(0.5), null, 10)
    expect(Math.abs(e.iasKt - 70)).toBeLessThan(0.1)
  })
  it('F8 touchdown', () => {
    const s = { ...AIR, altFt: 905, iasKt: 100, pitchDeg: -2 }
    const e = runFor(s, hold(100 / 140), null, 2)
    expect(e.onGround).toBe(true)
    expect(e.altFt).toBe(900)
  })
  it('takes off at full throttle with back pressure', () => {
    let s = runFor(DEFAULT_STATE, hold(1), null, 25)
    s = runFor(s, { roll: 0, pitch: 1, throttle: 1 }, null, 2)
    s = runFor(s, hold(1), null, 10)
    expect(s.onGround).toBe(false)
    expect(s.altFt).toBeGreaterThan(950)
  })
})
