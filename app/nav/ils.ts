import { AIRPORT_ELEV_FT, NM_TO_FT, clamp, rad2deg, wrap180, wrap360 } from '#shared/utils/units'
import { bearingDeg, distNm } from '#shared/utils/geo'
import type { AircraftState, IlsOutput, NavStation, RunwayInfo } from '#shared/types'
import { findNearest, inRange } from './range'

export const LOC_FULL_SCALE_DEG = 2.5
export const GS_FULL_SCALE_DEG = 0.7
export const GS_ANGLE_DEG = 3

export const NO_ILS: IlsOutput = { locValid: false, locDevDeg: 0, locFrac: 0, gsValid: false, gsDevDeg: 0, gsFrac: 0 }

/** The localiser tuned on navMHz (nearest on the frequency) and the runway it serves, if any. */
export function tunedLocaliser(stations: NavStation[], runways: RunwayInfo[], navMHz: number, ac: { x: number; y: number }): { loc: NavStation; runway: RunwayInfo } | null {
  const loc = findNearest(stations, ['ILS_LOC'], navMHz, ac)
  if (!loc) return null
  const runway = runways.find(r => r.id === loc.runwayId)
  return runway ? { loc, runway } : null
}

/** Localiser: positive = fly right (CONTRACTS §6). */
export function localiserDev(loc: { x: number; y: number }, runwayHdgDeg: number, ac: { x: number; y: number }): number {
  return wrap180(bearingDeg(loc, ac) - wrap360(runwayHdgDeg + 180))
}

/** Glide slope: positive = fly up. Elevation angle seen from the GS antenna. */
export function glideSlopeDev(gs: { x: number; y: number }, ac: { x: number; y: number; altFt: number }, elevFt = AIRPORT_ELEV_FT): number {
  const distFt = Math.max(distNm(gs, ac) * NM_TO_FT, 1)
  return GS_ANGLE_DEG - rad2deg(Math.atan2(ac.altFt - elevFt, distFt))
}

export function ilsReceive(stations: NavStation[], runways: RunwayInfo[], navMHz: number, ac: AircraftState, elevFt = AIRPORT_ELEV_FT): IlsOutput {
  const tuned = tunedLocaliser(stations, runways, navMHz, ac)
  if (!tuned || !inRange(tuned.loc, ac, elevFt)) return NO_ILS
  const locDevDeg = localiserDev(tuned.loc, tuned.runway.headingDeg, ac)
  if (Math.abs(locDevDeg) > 35) return NO_ILS
  const out: IlsOutput = { ...NO_ILS, locValid: true, locDevDeg, locFrac: clamp(locDevDeg / LOC_FULL_SCALE_DEG, -1, 1) }
  const gs = findNearest(stations, ['ILS_GS'], navMHz, ac)
  if (gs && distNm(gs, ac) <= gs.rangeNm) {
    const gsDevDeg = glideSlopeDev(gs, ac, elevFt)
    return { ...out, gsValid: true, gsDevDeg, gsFrac: clamp(gsDevDeg / GS_FULL_SCALE_DEG, -1, 1) }
  }
  return out
}
