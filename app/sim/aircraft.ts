/** Aircraft performance profiles used by the flight model, the autopilot and the instruments. IAS in kt. */
export interface AircraftProfile {
  id: 'jet' | 'trainer'
  name: string
  maxIasKt: number // full-throttle speed target (also the overspeed limit)
  accelKtPerSec: number
  decelKtPerSec: number
  rotateKt: number
  stallCleanKt: number // clean stall; full flap reduces it by 30 %
  gaugeMaxKt: number
  climbFpm: number
  descentFpm: number
  speeds: { climb: number; cruise: number; descent: number; approach: number; final: number; flare: number }
  /** Intermediate-fix distance and height (above the field) for automatic approaches. */
  ifNm: number
  ifHeightFt: number
  minRunwayM: number
}

export const JET: AircraftProfile = {
  id: 'jet', name: 'Jet airliner (A320 class)',
  maxIasKt: 350, accelKtPerSec: 5, decelKtPerSec: 4, rotateKt: 145, stallCleanKt: 125, gaugeMaxKt: 400,
  climbFpm: 2500, descentFpm: 2000,
  speeds: { climb: 250, cruise: 280, descent: 250, approach: 180, final: 140, flare: 135 },
  ifNm: 15, ifHeightFt: 4000, minRunwayM: 1800,
}

export const TRAINER: AircraftProfile = {
  id: 'trainer', name: 'Light trainer (C172 class)',
  maxIasKt: 140, accelKtPerSec: 3, decelKtPerSec: 3, rotateKt: 65, stallCleanKt: 55, gaugeMaxKt: 200,
  climbFpm: 1000, descentFpm: 1000,
  speeds: { climb: 110, cruise: 125, descent: 120, approach: 100, final: 85, flare: 75 },
  ifNm: 12, ifHeightFt: 3000, minRunwayM: 600,
}

export const PROFILES = { jet: JET, trainer: TRAINER } as const

export function stallKt(p: AircraftProfile, flapsDeg: number): number {
  return p.stallCleanKt * (1 - 0.3 * Math.min(1, flapsDeg / 30))
}
