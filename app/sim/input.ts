import { clamp } from '../../shared/utils/units'
import type { Controls } from '../../shared/types'

/** Maps held keys to control inputs. Arrow Up = nose down, Arrow Down = nose up. */
export function keysToControls(keys: Set<string>, throttle: number, dt: number): Controls {
  const roll = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
  const pitch = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)
  const thr = (keys.has('w') || keys.has('W') ? 1 : 0) - (keys.has('s') || keys.has('S') ? 1 : 0)
  return { roll, pitch, throttle: clamp(throttle + thr * 0.5 * dt, 0, 1) }
}
