import { deg2rad, rad2deg, wrap360 } from './units'

export interface LatLon { lat: number; lon: number }
export interface Vec2 { x: number; y: number }

/** Local-frame origin = VOBL runway 09L threshold (OurAirports). */
export const REF: LatLon = { lat: 13.207164, lon: 77.686073 }

export function toLocal(p: LatLon, ref: LatLon = REF): Vec2 {
  return {
    x: (p.lon - ref.lon) * 60 * Math.cos(deg2rad(ref.lat)),
    y: (p.lat - ref.lat) * 60,
  }
}

export function toLatLon(v: Vec2, ref: LatLon = REF): LatLon {
  return {
    lat: ref.lat + v.y / 60,
    lon: ref.lon + v.x / (60 * Math.cos(deg2rad(ref.lat))),
  }
}

export function bearingDeg(from: Vec2, to: Vec2): number {
  return wrap360(rad2deg(Math.atan2(to.x - from.x, to.y - from.y)))
}

export function distNm(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
