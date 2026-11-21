import { AIRPORT_ELEV_FT, G, KT_TO_FPM, KT_TO_MPS, clamp, deg2rad, rad2deg, wrap360 } from '../../shared/utils/units'
import type { AircraftState, Atmosphere, Controls, Wind } from '../../shared/types'
import { STANDARD_ATMOSPHERE, casToTas } from '../../shared/utils/isa'
import { applyWind } from './wind'
import { TRAINER, type AircraftProfile } from './aircraft'

export const ROTATE_KT = 65

export const DEFAULT_STATE: AircraftState = {
  x: -0.2, y: 0, altFt: AIRPORT_ELEV_FT, hdgDeg: 90, iasKt: 0, tasKt: 0, mach: 0, pitchDeg: 0, bankDeg: 0, vsFpm: 0,
  gsKt: 0, trackDeg: 90, throttle: 0, fuelPct: 100, gearDown: true, flapsDeg: 0, onGround: true,
}

/** One fixed step of the point-mass model (CONTRACTS §3). IAS is flown; TAS (ISA) moves the aircraft. Pure. */
export function step(s: AircraftState, c: Controls, wind: Wind | null, dt: number, atmo: Atmosphere = STANDARD_ATMOSPHERE, elevFt = AIRPORT_ELEV_FT, profile: AircraftProfile = TRAINER): AircraftState {
  const throttle = s.fuelPct <= 0 ? 0 : clamp(c.throttle, 0, 1)
  let bank = clamp(s.bankDeg + c.roll * 15 * dt, -35, 35)
  let pitch = clamp(s.pitchDeg + c.pitch * 5 * dt, -15, 20)

  const target = profile.maxIasKt * throttle
  const ias = clamp(s.iasKt + clamp(target - s.iasKt, -profile.decelKtPerSec * dt, profile.accelKtPerSec * dt), 0, profile.maxIasKt + 20)

  let onGround = s.onGround
  if (onGround) {
    bank = 0
    pitch = Math.max(0, pitch)
    if (ias < profile.rotateKt) pitch = 0
  }

  const { tasKt: tas, mach } = casToTas(ias, s.altFt, atmo)
  let hdg = s.hdgDeg
  const yaw = clamp(c.yaw ?? 0, -1, 1)
  if (!onGround) {
    const turnRad = (G * Math.tan(deg2rad(bank))) / Math.max(tas * KT_TO_MPS, 1)
    hdg = wrap360(hdg + (rad2deg(turnRad) + yaw * 3) * dt) // rudder adds up to 3°/s of yaw
  }
  else if (ias > 1) {
    hdg = wrap360(hdg + yaw * 20 * Math.min(1, ias / 15) * dt) // nosewheel steering
  }

  let vs = tas * KT_TO_FPM * Math.sin(deg2rad(pitch))
  let alt = s.altFt + (vs * dt) / 60

  if (onGround) {
    if (ias >= profile.rotateKt && pitch > 0) onGround = false
    else {
      alt = elevFt
      vs = 0
    }
  }
  else if (alt <= elevFt) {
    alt = elevFt
    vs = 0
    onGround = true
  }

  const g = applyWind(hdg, tas, onGround && ias < 1 ? null : wind)
  return {
    ...s,
    x: s.x + (g.vxKt * dt) / 3600,
    y: s.y + (g.vyKt * dt) / 3600,
    altFt: alt,
    hdgDeg: hdg,
    iasKt: ias,
    tasKt: tas,
    mach,
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
