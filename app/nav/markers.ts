import { AIRPORT_ELEV_FT, NM_TO_FT } from '#shared/utils/units'
import { distNm } from '#shared/utils/geo'
import type { AircraftState, MarkerOutput, NavStation } from '#shared/types'

/** A marker is heard inside its vertical cone: radius = max(0.05, 0.7 × height) NM (CONTRACTS §6). */
export function markerActive(st: { x: number; y: number }, ac: AircraftState, elevFt = AIRPORT_ELEV_FT): boolean {
  const hNm = Math.max(0, ac.altFt - elevFt) / NM_TO_FT
  return distNm(st, ac) <= Math.max(0.05, 0.7 * hNm)
}

export function markersReceive(stations: NavStation[], ac: AircraftState, elevFt = AIRPORT_ELEV_FT): MarkerOutput {
  const out: MarkerOutput = { om: false, mm: false, im: false }
  for (const s of stations) {
    if (s.type === 'MARKER_OM' && !out.om) out.om = markerActive(s, ac, elevFt)
    else if (s.type === 'MARKER_MM' && !out.mm) out.mm = markerActive(s, ac, elevFt)
    else if (s.type === 'MARKER_IM' && !out.im) out.im = markerActive(s, ac, elevFt)
  }
  return out
}
