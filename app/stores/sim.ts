import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'
import { createWorld, simStep, type Radios, type World } from '../sim/engine'
import { keysToControls } from '../sim/input'
import { DEFAULT_STATE } from '../sim/flightModel'
import type { Preset } from '../sim/presets'

export const useSimStore = defineStore('sim', () => {
  const world = shallowRef<World>(createWorld())
  const initial = shallowRef<World>(world.value)
  const paused = ref(false)
  const keys = new Set<string>()
  const trail = shallowRef<{ x: number; y: number }[]>([])
  let trailAcc = 0

  function load(w: World): void {
    world.value = w
    initial.value = w
    trail.value = []
    paused.value = false
  }

  function reset(): void {
    load(initial.value)
  }

  function tick(dt: number): void {
    if (paused.value) return
    const c = keysToControls(keys, world.value.ac.throttle, dt)
    world.value = simStep(world.value, c, dt)
    trailAcc += dt
    if (trailAcc >= 1) {
      trailAcc = 0
      const t = trail.value.length >= 600 ? trail.value.slice(1) : trail.value.slice()
      t.push({ x: world.value.ac.x, y: world.value.ac.y })
      trail.value = t
    }
  }

  function toggleGear(): void {
    const ac = world.value.ac
    world.value = { ...world.value, ac: { ...ac, gearDown: !ac.gearDown } }
  }

  function cycleFlaps(): void {
    const ac = world.value.ac
    const next = ({ 0: 10, 10: 20, 20: 30, 30: 0 } as const)[ac.flapsDeg]
    world.value = { ...world.value, ac: { ...ac, flapsDeg: next } }
  }

  function setRadio(p: Partial<Radios>): void {
    world.value = { ...world.value, radios: { ...world.value.radios, ...p } }
  }

  function setThrottle(t: number): void {
    const ac = world.value.ac
    world.value = { ...world.value, ac: { ...ac, throttle: Math.min(1, Math.max(0, t)) } }
  }

  function setFlaps(f: 0 | 10 | 20 | 30): void {
    world.value = { ...world.value, ac: { ...world.value.ac, flapsDeg: f } }
  }

  /** On-screen buttons press the same keys as the keyboard. */
  function holdKey(key: string, down: boolean): void {
    if (down) keys.add(key)
    else keys.delete(key)
  }

  function applyPreset(p: Preset): void {
    const w = { ...world.value, ac: { ...DEFAULT_STATE, ...p.ac }, radios: { ...world.value.radios, ...(p.radios ?? {}) }, done: null, simMs: 0, objProgress: { heldSec: 0 } }
    load(w)
  }

  return { world, paused, keys, trail, load, reset, tick, toggleGear, cycleFlaps, setRadio, setThrottle, setFlaps, holdKey, applyPreset }
})
