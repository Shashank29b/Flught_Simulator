import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'
import { REBASE_NM, createWorld, groundElevation, rebaseWorld, simStep, type Radios, type World } from '../sim/engine'
import { REF, toLatLon, type LatLon } from '../../shared/utils/geo'
import { airportsToLocal, runwaysToLocal, stationsToLocal, type NavDataRaw } from '../composables/useNavData'
import { keysToControls, manualInput } from '../sim/input'
import type { Journey } from '../sim/autoflight'
import { PROFILES } from '../sim/aircraft'
import { DEFAULT_STATE } from '../sim/flightModel'
import type { Preset } from '../sim/presets'

export const useSimStore = defineStore('sim', () => {
  const world = shallowRef<World>(createWorld())
  const initial = shallowRef<World>(world.value)
  const paused = ref(false)
  /** Simulation speed multiplier (time acceleration). */
  const timeScale = ref(1)
  const autoMessage = ref('')
  const keys = new Set<string>()
  /** Trail stored in lat/lon so it survives re-centring. */
  const trailLL = shallowRef<LatLon[]>([])
  const trail = shallowRef<{ x: number; y: number }[]>([])
  /** Centre for nav-data fetches; moves when the frame is re-centred. */
  const navCenter = shallowRef<LatLon>(REF)
  let trailAcc = 0
  let elevAcc = 0

  function setNavData(raw: NavDataRaw): void {
    const ref = world.value.ref
    const w = { ...world.value, stations: stationsToLocal(raw.stations, ref), runways: runwaysToLocal(raw.airports, ref), airports: airportsToLocal(raw.airports, ref) }
    world.value = { ...w, groundElevFt: groundElevation(w) }
  }

  function rebuildTrail(): void {
    const ref = world.value.ref
    trail.value = trailLL.value.map(p => {
      const c = Math.cos((ref.lat * Math.PI) / 180)
      return { x: (p.lon - ref.lon) * 60 * c, y: (p.lat - ref.lat) * 60 }
    })
  }

  function load(w: World): void {
    world.value = w
    initial.value = w
    trail.value = []
    trailLL.value = []
    paused.value = false
    timeScale.value = 1
    autoMessage.value = ''
    navCenter.value = w.ref
  }

  function reset(): void {
    load(initial.value)
  }

  function tick(dt: number): void {
    if (paused.value) return
    if (world.value.auto && manualInput(keys)) {
      world.value = { ...world.value, auto: null }
      autoMessage.value = 'Autopilot disengaged by manual input'
    }
    const c = keysToControls(keys, world.value.ac.throttle, dt)
    world.value = simStep(world.value, c, dt)
    const ac = world.value.ac
    if (Math.hypot(ac.x, ac.y) > REBASE_NM) {
      world.value = rebaseWorld(world.value, toLatLon(ac, world.value.ref))
      navCenter.value = world.value.ref
      rebuildTrail()
    }
    trailAcc += dt
    if (trailAcc >= 1) {
      trailAcc = 0
      const t = trailLL.value.length >= 1200 ? trailLL.value.slice(1) : trailLL.value.slice()
      t.push(toLatLon(world.value.ac, world.value.ref))
      trailLL.value = t
      rebuildTrail()
    }
    elevAcc += dt
    if (elevAcc >= 2 && world.value.airports.length) {
      elevAcc = 0
      const g = groundElevation(world.value)
      if (g !== world.value.groundElevFt && !world.value.ac.onGround) world.value = { ...world.value, groundElevFt: g }
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
    const atRef = world.value.ref.lat === REF.lat && world.value.ref.lon === REF.lon
    const base = atRef ? world.value : { ...world.value, ref: REF, stations: [], runways: [], airports: [] }
    const prof = world.value.profile
    const speed = p.id === 'ils' ? prof.speeds.final : prof.speeds.cruise
    const ac = { ...DEFAULT_STATE, ...p.ac, ...(p.ac.onGround === false ? { iasKt: speed, throttle: speed / prof.maxIasKt } : {}) }
    const w = { ...base, journey: null, auto: null, ac, groundElevFt: 3000, radios: { ...base.radios, ...(p.radios ?? {}) }, done: null, simMs: 0, objProgress: { heldSec: 0 } }
    load(w)
  }

  /** Places the aircraft on the departure runway and engages the automatic journey. */
  function startJourney(j: Journey): void {
    const ref = { lat: j.from.runway.lat, lon: j.from.runway.lon }
    const h = (j.from.runway.headingDeg * Math.PI) / 180
    const w = {
      ...world.value,
      ref,
      stations: [], runways: [], airports: [],
      ac: { ...DEFAULT_STATE, x: 0.05 * Math.sin(h), y: 0.05 * Math.cos(h), hdgDeg: j.from.runway.headingDeg, trackDeg: j.from.runway.headingDeg, altFt: j.from.elevationFt },
      groundElevFt: j.from.elevationFt,
      journey: j,
      auto: { phase: 'TAKEOFF_ROLL' as const },
      objective: null, done: null, simMs: 0, objProgress: { heldSec: 0 },
    }
    load(w)
  }

  function setProfile(id: 'jet' | 'trainer'): void {
    world.value = { ...world.value, profile: PROFILES[id] }
  }

  const TIME_SCALES = [1, 2, 4, 8, 16, 32, 64]
  function stepTimeScale(dir: 1 | -1): void {
    const i = TIME_SCALES.indexOf(timeScale.value)
    timeScale.value = TIME_SCALES[Math.min(TIME_SCALES.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))]!
  }

  /** ±kt: in a journey changes the autopilot cruise speed, otherwise the throttle (target IAS). */
  function changeSpeed(deltaKt: number): void {
    const w = world.value
    const p = w.profile
    if (w.journey && w.auto) {
      const cur = w.journey.cruiseIasKt ?? p.speeds.cruise
      const next = Math.min(p.maxIasKt, Math.max(p.stallCleanKt + 20, cur + deltaKt))
      world.value = { ...w, journey: { ...w.journey, cruiseIasKt: next } }
      return
    }
    setThrottle((w.ac.throttle * p.maxIasKt + deltaKt) / p.maxIasKt)
  }

  function engageAuto(): void {
    if (!world.value.journey) return
    const ac = world.value.ac
    autoMessage.value = ''
    world.value = { ...world.value, auto: { phase: ac.onGround ? (ac.iasKt < 3 ? 'TAKEOFF_ROLL' : 'ROLLOUT') : 'CRUISE' } }
  }

  function disengageAuto(): void {
    world.value = { ...world.value, auto: null }
    autoMessage.value = 'Autopilot off: you have control'
  }

  function endJourney(): void {
    world.value = { ...world.value, journey: null, auto: null }
    timeScale.value = 1
    autoMessage.value = ''
  }

  return { world, paused, timeScale, autoMessage, keys, trail, navCenter, setNavData, setProfile, stepTimeScale, changeSpeed, startJourney, engageAuto, disengageAuto, endJourney, load, reset, tick, toggleGear, cycleFlaps, setRadio, setThrottle, setFlaps, holdKey, applyPreset }
})
