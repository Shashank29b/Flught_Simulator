/**
 * Strapdown INS error model (CONTRACTS §10). Integrating measured acceleration = true acceleration + bias + noise
 * gives INS position = true position + error, where the error obeys err̈ = bias + σ·n. Modelling the error directly
 * keeps it independent of the (re-centring) local frame. Metres and seconds.
 */
import { gaussian } from '../../shared/utils/random'

export interface InsState { errX: number; errY: number; errVx: number; errVy: number; bias: [number, number]; sigma: number }

export function insInit(opts: { bias?: [number, number]; sigma?: number } = {}): InsState {
  return { errX: 0, errY: 0, errVx: 0, errVy: 0, bias: opts.bias ?? [0.002, -0.0015], sigma: opts.sigma ?? 0.001 }
}

export function insStep(s: InsState, dt: number, rng: () => number): InsState {
  const ax = s.bias[0] + s.sigma * gaussian(rng)
  const ay = s.bias[1] + s.sigma * gaussian(rng)
  const errVx = s.errVx + ax * dt
  const errVy = s.errVy + ay * dt
  return { ...s, errVx, errVy, errX: s.errX + errVx * dt, errY: s.errY + errVy * dt }
}

export const insErrorM = (s: InsState): number => Math.hypot(s.errX, s.errY)
