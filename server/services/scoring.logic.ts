import type { FlightResult } from '#shared/types'

export interface LandingData { lateralM: number; vsFpm: number; meanAbsLocFrac: number }

/** CONTRACTS §7 scoring. Pure. */
export function score(result: FlightResult, landing?: LandingData): { total: number; details: Record<string, number> } {
  if (result === 'COMPLETED') return { total: 100, details: { objective: 100 } }
  if (result !== 'LANDED' || !landing) return { total: 0, details: {} }
  const centre = 40 * Math.max(0, 1 - Math.abs(landing.lateralM) / 80)
  const vs = Math.abs(landing.vsFpm)
  const touch = vs <= 300 ? 30 : vs >= 900 ? 0 : 30 * (1 - (vs - 300) / 600)
  const track = 30 * (1 - Math.min(1, Math.abs(landing.meanAbsLocFrac)))
  const r = (v: number) => Math.round(v * 10) / 10
  return {
    total: Math.round(centre + touch + track),
    details: { centreline: r(centre), touchdown: r(touch), tracking: r(track), lateralM: r(landing.lateralM), vsFpm: Math.round(landing.vsFpm), meanAbsLocFrac: Math.round(landing.meanAbsLocFrac * 1000) / 1000 },
  }
}
