import { AIRPORT_ELEV_FT } from '../../shared/utils/units'
import { distNm } from '../../shared/utils/geo'
import type { AircraftState, NavStation } from '../../shared/types'

export function losNm(altFt: number, elevFt = AIRPORT_ELEV_FT): number {
  return 1.23 * Math.sqrt(Math.max(altFt - elevFt, 100))
}

export function inRange(st: NavStation, ac: AircraftState, elevFt = AIRPORT_ELEV_FT): boolean {
  return distNm(st, ac) <= Math.min(st.rangeNm, losNm(ac.altFt, elevFt))
}

/** Worldwide data reuses frequencies: pick the nearest matching station. */
export function findNearest(stations: NavStation[], types: NavStation['type'][], freq: number, ac: { x: number; y: number }): NavStation | undefined {
  let best: NavStation | undefined
  let bestD = Infinity
  for (const s of stations) {
    if (!types.includes(s.type) || Math.abs(s.frequency - freq) >= 0.001) continue
    const d = distNm(s, ac)
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}

export function findStation(stations: NavStation[], types: NavStation['type'][], freq: number): NavStation | undefined {
  return stations.find(s => types.includes(s.type) && Math.abs(s.frequency - freq) < 0.001)
}
