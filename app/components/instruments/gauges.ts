import { clamp } from '../../../shared/utils/units'

export const airspeedNeedleDeg = (ias: number, maxKt = 200): number => (clamp(ias, 0, maxKt) / maxKt) * 320

export function altHands(alt: number): { hundredsDeg: number; thousandsDeg: number } {
  const a = Math.max(0, alt)
  return { hundredsDeg: ((a % 1000) / 1000) * 360, thousandsDeg: ((a % 10000) / 10000) * 360 }
}

export const vsiNeedleDeg = (vs: number): number => (clamp(vs, -2000, 2000) / 2000) * 160
export const attitudeOffsetPx = (pitchDeg: number, pxPerDeg = 4): number => pitchDeg * pxPerDeg
export const headingCardRotation = (hdg: number): number => -hdg
export const cdiNeedlePx = (frac: number, halfWidthPx: number): number => frac * halfWidthPx
