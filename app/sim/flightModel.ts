import { AIRPORT_ELEV_FT, G, KT_TO_FPM, KT_TO_MPS, clamp, deg2rad, rad2deg, wrap360 } from '../../shared/utils/units'
import type { AircraftState, Controls, Wind } from '../../shared/types'
import { applyWind } from './wind'

export const ROTATE_KT = 65

export const DEFAULT_STATE: AircraftState = {
  x: -0.2, y: 0, altFt: AIRPORT_ELEV_FT, hdgDeg: 90, iasKt: 0, pitchDeg: 0, bankDeg: 0, vsFpm: 0,
  gsKt: 0, trackDeg: 90, throttle: 0, fuelPct: 100, gearDown: true, flapsDeg: 0, onGround: true,
}

/** One fixed step of the point-mass model (CONTRACTS §3). Pure. */
export function step(s: AircraftState, c: Controls, wind: Wind | null, dt: number): AircraftState {
  const throttle = s.fuelPct <= 0 ? 0 : clamp(c.throttle, 0, 1)
  let bank = clamp(s.bankDeg + c.roll * 15 * dt, -35, 35)
  let pitch = clamp(s.pitchDeg + c.pitch * 5 * dt, -15, 20)

  const target = 140 * throttle
  const maxDelta = 3 * dt
  const ias = clamp(s.iasKt + clamp(target - s.iasKt, -maxDelta, maxDelta), 0, 200)

  let onGround = s.onGround
  if (onGround) {
    bank = 0
    pitch = Math.max(0, pitch)
    if (ias < ROTATE_KT) pitch = 0
  }

  let hdg = s.hdgDeg
  if (!onGround) {
    const turnRad = (G * Math.tan(deg2rad(bank))) / Math.max(ias * KT_TO_MPS, 1)
    hdg = wrap360(hdg + rad2deg(turnRad) * dt)
  }

  let vs = ias * KT_TO_FPM * Math.sin(deg2rad(pitch))
  let alt = s.altFt + (vs * dt) / 60

  if (onGround) {
    if (ias >= ROTATE_KT && pitch > 0) onGround = false
    else {
      alt = AIRPORT_ELEV_FT
      vs = 0
    }
  }
  else if (alt <= AIRPORT_ELEV_FT) {
    alt = AIRPORT_ELEV_FT
    vs = 0
    onGround = true
  }

  const g = applyWind(hdg, ias, onGround && ias < 1 ? null : wind)
  return {
    ...s,
    x: s.x + (g.vxKt * dt) / 3600,
    y: s.y + (g.vyKt * dt) / 3600,
    altFt: alt,
    hdgDeg: hdg,
    iasKt: ias,
    pitchDeg: pitch,
    bankDeg: bank,
    vsFpm: vs,
    gsKt: g.gsKt,
    trackDeg: g.trackDeg,
    throttle,
    fuelPct: Math.max(0, s.fuelPct - 0.01 * throttle * dt),
    onGround,
  }
}
