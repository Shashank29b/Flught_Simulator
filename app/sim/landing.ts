import { NM_TO_M, deg2rad } from '#shared/utils/units'
import type { AircraftState, RunwayInfo } from '#shared/types'

export interface Touchdown {
  result: 'LANDED' | 'CRASHED'
  runwayIdent: string | null
  lateralM: number // + = right of the centreline
  alongM: number // from the threshold toward the far end
  vsFpm: number
  bankDeg: number
  reasons: string[]
}

/** Runway-relative position in metres. */
export function runwayOffsets(ac: { x: number; y: number }, r: RunwayInfo): { alongM: number; lateralM: number } {
  const h = deg2rad(r.headingDeg)
  const rx = (ac.x - r.x) * NM_TO_M
  const ry = (ac.y - r.y) * NM_TO_M
  return { alongM: rx * Math.sin(h) + ry * Math.cos(h), lateralM: rx * Math.cos(h) - ry * Math.sin(h) }
}

/**
 * Judges a touchdown (CONTRACTS §7). `pre` is the state on the step before touchdown (its sink rate and bank are used).
 * The runway is the one the aircraft is on, else the nearest by centreline distance.
 */
export function judgeTouchdown(pre: AircraftState, ac: AircraftState, runways: RunwayInfo[]): Touchdown {
  let best: { r: RunwayInfo; alongM: number; lateralM: number; score: number } | null = null
  for (const r of runways) {
    const o = runwayOffsets(ac, r)
    const outside = Math.max(0, -o.alongM, o.alongM - r.lengthM)
    const score = Math.abs(o.lateralM) + outside
    if (!best || score < best.score) best = { r, ...o, score }
  }
  const reasons: string[] = []
  if (!best || best.score > 1000) reasons.push('touched down away from any runway')
  else {
    if (Math.abs(best.lateralM) > best.r.widthM / 2) reasons.push(`off the runway edge (${Math.abs(best.lateralM).toFixed(0)} m from the centreline)`)
    if (best.alongM < 0) reasons.push(`landed short (${(-best.alongM).toFixed(0)} m before the threshold)`)
    if (best.alongM > best.r.lengthM) reasons.push('landed beyond the runway end')
  }
  if (Math.abs(pre.vsFpm) > 900) reasons.push(`hard landing (${Math.abs(pre.vsFpm).toFixed(0)} fpm)`)
  if (Math.abs(pre.bankDeg) > 10) reasons.push(`wing strike (bank ${Math.abs(pre.bankDeg).toFixed(0)}°)`)
  if (!pre.gearDown) reasons.push('gear up')
  return {
    result: reasons.length ? 'CRASHED' : 'LANDED',
    runwayIdent: best?.r.ident ?? null,
    lateralM: best?.lateralM ?? 0,
    alongM: best?.alongM ?? 0,
    vsFpm: pre.vsFpm,
    bankDeg: pre.bankDeg,
    reasons,
  }
}
