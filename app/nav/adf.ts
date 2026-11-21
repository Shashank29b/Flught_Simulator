import { wrap360 } from '../../shared/utils/units'
import { bearingDeg } from '../../shared/utils/geo'
import type { AdfOutput, AircraftState, NavStation } from '../../shared/types'
import { findNearest, inRange } from './range'

export function adfReceive(stations: NavStation[], adfKHz: number, ac: AircraftState, elevFt?: number): AdfOutput {
  const st = findNearest(stations, ['NDB'], adfKHz, ac)
  if (!st || !inRange(st, ac, elevFt)) return { valid: false, ident: '', relBearingDeg: 90, bearingToDeg: 0 }
  const bearingToDeg = bearingDeg(ac, st)
  return { valid: true, ident: st.ident, bearingToDeg, relBearingDeg: wrap360(bearingToDeg - ac.hdgDeg) }
}
