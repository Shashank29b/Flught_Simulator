import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, step } from '../../app/sim/flightModel'
import type { AircraftState, Controls, Wind } from '../../shared/types'
import { AIRPORT_ELEV_FT } from '../../shared/utils/units'

const AIR: AircraftState = { ...DEFAULT_STATE, onGround: false, gearDown: false, altFt: 3900, iasKt: 120, throttle: 120 / 140, hdgDeg: 90 }
const hold = (throttle: number): Controls => ({ roll: 0, pitch: 0, throttle })

function runFor(s: AircraftState, c: Controls, wind: Wind | null, seconds: number, dt = 1 / 60): AircraftState {
  let st = s
  for (let i = 0; i < Math.round(seconds / dt); i++) st = step(st, c, wind, dt)
  return st
}

describe('flight model', () => {
  it('F1 straight and level 60 s at 120 kt IAS (TAS 127.07 kt at 3900 ft ISA)', () => {
    const e = runFor(AIR, hold(120 / 140), null, 60)
    expect(Math.abs(e.x - AIR.x - 127.066 / 60)).toBeLessThan(0.01)
    expect(e.tasKt).toBeCloseTo(127.066, 2)
    expect(Math.abs(e.y - AIR.y)).toBeLessThan(0.01)
    expect(Math.abs(e.altFt - AIR.altFt)).toBeLessThan(1)
  })
  it('F2 standard-rate turn', () => {
    const s = { ...AIR, iasKt: 100, throttle: 100 / 140, bankDeg: 15, hdgDeg: 0 }
    const e = runFor(s, hold(100 / 140), null, 1)
    expect(Math.abs(e.hdgDeg - 2.763)).toBeLessThan(0.05) // TAS 105.9 kt at 3900 ft
    const sl = runFor({ ...s, altFt: 3100 }, hold(100 / 140), null, 1)
    expect(sl.hdgDeg).toBeGreaterThan(e.hdgDeg) // lower altitude → lower TAS → faster turn
  })
  it('F3 climb rate from pitch', () => {
    const e = step({ ...AIR, pitchDeg: 5 }, hold(120 / 140), null, 1 / 60)
    expect(Math.abs(e.vsFpm - 1121.5)).toBeLessThan(5) // 127.07 kt TAS × sin 5°
  })
  it('F4 wind triangle', () => {
    const e = step({ ...AIR, hdgDeg: 0, iasKt: 100 }, hold(100 / 140), { fromDeg: 270, speedKt: 20 }, 1 / 60)
    expect(Math.abs(e.trackDeg - 10.694)).toBeLessThan(0.1) // TAS 105.91 kt
    expect(Math.abs(e.gsKt - 107.78)).toBeLessThan(0.1)
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
    const s = { ...AIR, altFt: AIRPORT_ELEV_FT + 5, iasKt: 100, pitchDeg: -2 }
    const e = runFor(s, hold(100 / 140), null, 2)
    expect(e.onGround).toBe(true)
    expect(e.altFt).toBe(AIRPORT_ELEV_FT)
  })
  it('F9 hot day (ISA+20) gives a higher TAS for the same IAS', () => {
    const std = step(AIR, hold(120 / 140), null, 1 / 60)
    const hot = step(AIR, hold(120 / 140), null, 1 / 60, { qnhHpa: 1013.25, isaDevC: 20 })
    expect(hot.tasKt).toBeGreaterThan(std.tasKt + 3)
    expect(hot.mach).toBeGreaterThan(0)
  })
  it('F10 rudder yaws in the air and steers on the ground', () => {
    const air = runFor(AIR, { roll: 0, pitch: 0, throttle: 120 / 140, yaw: 1 }, null, 2)
    expect(air.hdgDeg).toBeCloseTo(96, 1)
    const g = runFor({ ...DEFAULT_STATE, iasKt: 20, throttle: 20 / 140 }, { roll: 0, pitch: 0, throttle: 20 / 140, yaw: -1 }, null, 1)
    expect(g.hdgDeg).toBeLessThan(DEFAULT_STATE.hdgDeg - 15)
  })
  it('F11 fuel: the jet burns 100 % / 14 h at full throttle (≈ 5.7 % per hour at 80 %)', async () => {
    const { JET } = await import('../../app/sim/aircraft')
    let st = { ...AIR, iasKt: 280, throttle: 0.8, altFt: 35000 }
    for (let i = 0; i < 3600; i++) st = step(st, hold(0.8), null, 1, undefined, AIRPORT_ELEV_FT, JET)
    expect(100 - st.fuelPct).toBeCloseTo((0.8 * 100) / 14, 1)
  })
  it('F12 no thrust in the air: speed stops at the stall limit and the aircraft glides down (never freezes)', () => {
    let st = { ...AIR, iasKt: 120, throttle: 0, fuelPct: 0 }
    for (let i = 0; i < 60 * 60; i++) st = step(st, hold(0), null, 1 / 60)
    expect(st.iasKt).toBeGreaterThan(45)
    expect(st.vsFpm).toBeLessThan(-300)
    expect(st.altFt).toBeLessThan(AIR.altFt - 300)
  })
  it('takes off at full throttle with back pressure', () => {
    let s = runFor(DEFAULT_STATE, hold(1), null, 25)
    s = runFor(s, { roll: 0, pitch: 1, throttle: 1 }, null, 2)
    s = runFor(s, hold(1), null, 10)
    expect(s.onGround).toBe(false)
    expect(s.altFt).toBeGreaterThan(AIRPORT_ELEV_FT + 50)
  })
})
