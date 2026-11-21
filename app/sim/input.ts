import { clamp } from '#shared/utils/units'
import type { Controls } from '#shared/types'

/**
 * Keyboard flight controls:
 *   W / S  stick forward / back (pitch down / up)   A / D  roll left / right   Q / E  yaw (rudder) left / right
 *   ↑ / ↓ or + / −  throttle up / down (0.5 per second)
 */
export function keysToControls(keys: Set<string>, throttle: number, dt: number): Controls {
  const has = (...k: string[]) => k.some(x => keys.has(x))
  const roll = (has('d', 'D') ? 1 : 0) - (has('a', 'A') ? 1 : 0)
  const pitch = (has('s', 'S') ? 1 : 0) - (has('w', 'W') ? 1 : 0)
  const yaw = (has('e', 'E') ? 1 : 0) - (has('q', 'Q') ? 1 : 0)
  const thr = (has('ArrowUp', '+', '=') ? 1 : 0) - (has('ArrowDown', '-', '_') ? 1 : 0)
  return { roll, pitch, yaw, throttle: clamp(throttle + thr * 0.5 * dt, 0, 1) }
}

/** True when any pitch/roll/yaw key is held (used to disengage the autopilot). */
export function manualInput(keys: Set<string>): boolean {
  return ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D', 'q', 'Q', 'e', 'E'].some(k => keys.has(k))
}
