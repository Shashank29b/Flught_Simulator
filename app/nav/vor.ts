import { clamp, deg2rad, wrap180, wrap360 } from '#shared/utils/units'
import { bearingDeg, type Vec2 } from '#shared/utils/geo'
import type { AircraftState, NavStation, ToFrom, VorOutput } from '#shared/types'
import { findNearest, inRange } from './range'

/** Radial (bearing from station) with the type's site error. */
export function radialDeg(st: Vec2, ac: Vec2, kind: 'VOR' | 'DVOR'): number {
  const t = bearingDeg(st, ac)
  const amp = kind === 'VOR' ? 1.5 : 0.3
  return wrap360(t + amp * Math.sin(deg2rad(2 * t)))
}

export function cdi(radial: number, obsDeg: number): { toFrom: ToFrom; cdiDevDeg: number; cdiFrac: number } {
  const d = wrap180(obsDeg - radial)
  if (Math.abs(Math.abs(d) - 90) < 3) return { toFrom: 'OFF', cdiDevDeg: 0, cdiFrac: 0 }
  const dev = Math.abs(d) < 90 ? d : -wrap180(d - 180)
  return { toFrom: Math.abs(d) < 90 ? 'FROM' : 'TO', cdiDevDeg: dev, cdiFrac: clamp(dev / 10, -1, 1) }
}

export function invalidVor(obsDeg: number): VorOutput {
  return { valid: false, ident: '', radialDeg: 0, obsDeg, toFrom: 'OFF', cdiDevDeg: 0, cdiFrac: 0 }
}

export function vorReceive(stations: NavStation[], nav1MHz: number, obsDeg: number, ac: AircraftState, elevFt?: number): VorOutput {
  const st = findNearest(stations, ['VOR', 'DVOR'], nav1MHz, ac)
  if (!st || !inRange(st, ac, elevFt)) return invalidVor(obsDeg)
  const r = radialDeg(st, ac, st.type === 'DVOR' ? 'DVOR' : 'VOR')
  return { valid: true, ident: st.ident, radialDeg: r, obsDeg, ...cdi(r, obsDeg) }
}
