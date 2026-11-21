import { AIRPORT_ELEV_FT, NM_TO_FT } from '../../shared/utils/units'
import { distNm } from '../../shared/utils/geo'
import type { AircraftState, DmeOutput, NavStation } from '../../shared/types'
import { findNearest, inRange } from './range'

export function slantNm(st: NavStation, ac: AircraftState, elevFt = AIRPORT_ELEV_FT): number {
  const h = (ac.altFt - elevFt) / NM_TO_FT
  return Math.sqrt(distNm(st, ac) ** 2 + h * h)
}

export function dmeReceive(stations: NavStation[], nav1MHz: number, ac: AircraftState, elevFt?: number): DmeOutput {
  const st = findNearest(stations, ['DME'], nav1MHz, ac)
  if (!st || !inRange(st, ac, elevFt)) return { valid: false, distNm: 0 }
  return { valid: true, distNm: slantNm(st, ac, elevFt) }
}
