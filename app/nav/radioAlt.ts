import { AIRPORT_ELEV_FT } from '#shared/utils/units'
import type { AircraftState } from '#shared/types'

export const RA_MAX_FT = 2500
export const CALLOUTS = [1000, 500, 100, 50] as const

/** Height above the (flat) terrain, or null above 2500 ft. */
export function radioAltFt(ac: AircraftState, elevFt = AIRPORT_ELEV_FT): number | null {
  const h = ac.altFt - elevFt
  return h > RA_MAX_FT ? null : Math.max(0, h)
}

/** Callouts crossed while descending from prevRa to ra. */
export function callouts(prevRa: number | null, ra: number | null): number[] {
  if (prevRa === null || ra === null) return []
  return CALLOUTS.filter(c => prevRa > c && c >= ra)
}
