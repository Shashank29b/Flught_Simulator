import { deg2rad, rad2deg, wrap360 } from '#shared/utils/units'
import type { Wind } from '#shared/types'

export interface GroundVector { gsKt: number; trackDeg: number; vxKt: number; vyKt: number }

/** Air vector (heading, IAS) plus wind (blowing toward fromDeg + 180) gives the ground vector. */
export function applyWind(hdgDeg: number, iasKt: number, wind: Wind | null): GroundVector {
  const h = deg2rad(hdgDeg)
  let vx = iasKt * Math.sin(h)
  let vy = iasKt * Math.cos(h)
  if (wind && wind.speedKt > 0) {
    const to = deg2rad(wind.fromDeg + 180)
    vx += wind.speedKt * Math.sin(to)
    vy += wind.speedKt * Math.cos(to)
  }
  const gsKt = Math.hypot(vx, vy)
  const trackDeg = gsKt < 1e-6 ? wrap360(hdgDeg) : wrap360(rad2deg(Math.atan2(vx, vy)))
  return { gsKt, trackDeg, vxKt: vx, vyKt: vy }
}
