import { AIRPORT_ELEV_FT, NM_TO_FT } from '../../shared/utils/units'
import { distNm } from '../../shared/utils/geo'
import type { AircraftState, DmeOutput, NavStation } from '../../shared/types'
import { findStation, inRange } from './range'

export function slantNm(st: NavStation, ac: AircraftState): number {
  const h = (ac.altFt - AIRPORT_ELEV_FT) / NM_TO_FT
  return Math.sqrt(distNm(st, ac) ** 2 + h * h)
}

export function dmeReceive(stations: NavStation[], nav1MHz: number, ac: AircraftState): DmeOutput {
  const st = findStation(stations, ['DME'], nav1MHz)
  if (!st || !inRange(st, ac)) return { valid: false, distNm: 0 }
  return { valid: true, distNm: slantNm(st, ac) }
}
