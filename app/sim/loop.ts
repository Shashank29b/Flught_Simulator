/** Fixed-timestep accumulator. Drops the backlog when maxSteps is hit. */
export function advance(acc: number, frameDtSec: number, stepDt = 1 / 60, maxSteps = 5): { steps: number; acc: number } {
  let a = acc + Math.max(0, frameDtSec)
  let steps = Math.floor(a / stepDt + 1e-9)
  if (steps > maxSteps) {
    return { steps: maxSteps, acc: 0 }
  }
  a -= steps * stepDt
  if (Math.abs(a) < 1e-9) a = 0
  steps = Math.max(0, steps)
  return { steps, acc: a }
}
