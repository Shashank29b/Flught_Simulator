import { AIRPORT_ELEV_FT } from '../../shared/utils/units'
import { distNm } from '../../shared/utils/geo'
import type { AircraftState, NavStation } from '../../shared/types'

export function losNm(altFt: number): number {
  return 1.23 * Math.sqrt(Math.max(altFt - AIRPORT_ELEV_FT, 100))
}

export function inRange(st: NavStation, ac: AircraftState): boolean {
  return distNm(st, ac) <= Math.min(st.rangeNm, losNm(ac.altFt))
}

export function findStation(stations: NavStation[], types: NavStation['type'][], freq: number): NavStation | undefined {
  return stations.find(s => types.includes(s.type) && Math.abs(s.frequency - freq) < 0.001)
}
