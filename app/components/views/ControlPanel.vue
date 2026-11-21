<script setup lang="ts">
import { computed } from 'vue'
import { hoursLeft, stallKt } from '../../sim/aircraft'
import { useSimStore } from '../../stores/sim'
import { PRESETS } from '../../sim/presets'

const store = useSimStore()
const FLAPS = [0, 10, 20, 30] as const
const yoke = [
  { key: 'q', label: '↶ Yaw L (Q)', cls: 'col-start-1' },
  { key: 's', label: '▲ Pitch up (S)', cls: 'col-start-2' },
  { key: 'e', label: 'Yaw R (E) ↷', cls: 'col-start-3' },
  { key: 'a', label: '◀ Roll L (A)', cls: 'col-start-1' },
  { key: 'w', label: '▼ Pitch dn (W)', cls: 'col-start-2' },
  { key: 'd', label: 'Roll R (D) ▶', cls: 'col-start-3' },
]
const lc = computed(() => store.world.lastControls)
const stalled = computed(() => !store.world.ac.onGround && store.world.ac.iasKt <= 0.9 * stallKt(store.world.profile, store.world.ac.flapsDeg) + 0.5)
const endurance = computed(() => {
  const h = hoursLeft(store.world.profile, store.world.ac.fuelPct, Math.max(store.world.ac.throttle, 0.05))
  return Number.isFinite(h) ? `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}` : '∞'
})
const targetSpeed = computed(() => {
  const w = store.world
  if (w.journey && w.auto) return `CRZ ${(w.journey.cruiseIasKt ?? w.profile.speeds.cruise).toFixed(0)}`
  return (w.ac.throttle * w.profile.maxIasKt).toFixed(0)
})
const hold = (k: string, d: boolean) => store.holdKey(k, d)
</script>

<template>
  <div class="space-y-2 rounded border border-slate-800 bg-slate-950 p-2 text-xs">
    <div class="flex flex-wrap gap-1">
      <span class="self-center text-slate-400">Aircraft:</span>
      <button v-for="p in (['jet', 'trainer'] as const)" :key="p" class="rounded px-2 py-1" :class="store.world.profile.id === p ? 'bg-sky-700' : 'bg-slate-800 hover:bg-slate-700'" @click="store.setProfile(p)">{{ p === 'jet' ? 'Jet (350 kt)' : 'Trainer (140 kt)' }}</button>
      <span class="ml-2 self-center text-slate-400">Start at:</span>
      <button v-for="p in PRESETS" :key="p.id" class="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700" @click="store.applyPreset(p)">{{ p.label }}</button>
    </div>
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <div class="grid w-72 grid-cols-[1fr_1fr_1fr_auto] gap-1 select-none">
        <button
v-for="b in yoke" :key="b.key" :class="b.cls" class="rounded bg-slate-800 px-1 py-2 active:bg-sky-700"
          @pointerdown.prevent="hold(b.key, true)" @pointerup="hold(b.key, false)" @pointerleave="hold(b.key, false)" @pointercancel="hold(b.key, false)">{{ b.label }}</button>
        <div class="col-start-4 row-span-2 row-start-1 flex flex-col items-center gap-1" title="Live control deflection (you or the autopilot)">
          <svg width="56" height="56" viewBox="-28 -28 56 56" class="rounded bg-slate-900">
            <line x1="-26" y1="0" x2="26" y2="0" stroke="#334155" /><line x1="0" y1="-26" x2="0" y2="26" stroke="#334155" />
            <circle :cx="lc.roll * 22" :cy="-lc.pitch * 22" r="5" fill="#38bdf8" />
          </svg>
          <svg width="56" height="8" viewBox="-28 -4 56 8"><rect x="-26" y="-3" width="52" height="6" fill="#1e293b" /><rect :x="Math.min(0, (lc.yaw ?? 0) * 26)" y="-3" :width="Math.abs((lc.yaw ?? 0) * 26)" height="6" fill="#f59e0b" /></svg>
          <span class="text-[10px] text-slate-500">stick · rudder</span>
        </div>
      </div>
      <div class="space-y-1">
        <label class="flex items-center gap-2">
          <span class="w-16 text-slate-400">Throttle</span>
          <input type="range" min="0" max="100" :value="Math.round(store.world.ac.throttle * 100)" class="flex-1 accent-sky-500" @input="store.setThrottle(Number(($event.target as HTMLInputElement).value) / 100)">
          <span class="w-10 text-right font-mono">{{ (store.world.ac.throttle * 100).toFixed(0) }}%</span>
        </label>
        <div class="flex items-center gap-2">
          <span class="w-16 text-slate-400">Flaps</span>
          <button v-for="f in FLAPS" :key="f" class="rounded px-2 py-0.5" :class="store.world.ac.flapsDeg === f ? 'bg-sky-700' : 'bg-slate-800'" @click="store.setFlaps(f)">{{ f }}</button>
          <span class="ml-3 text-slate-400">Gear</span>
          <button class="rounded px-2 py-0.5" :class="store.world.ac.gearDown ? 'bg-green-800' : 'bg-slate-800'" @click="store.toggleGear()">{{ store.world.ac.gearDown ? 'DOWN ●●●' : 'UP' }}</button>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1" title="Aircraft speed: target airspeed (journey: cruise speed)">
          <button class="rounded bg-slate-800 px-1.5 py-1" @click="store.changeSpeed(-10)">−10</button>
          <span class="w-20 text-center font-mono">{{ targetSpeed }} kt</span>
          <button class="rounded bg-slate-800 px-1.5 py-1" @click="store.changeSpeed(10)">+10</button>
        </div>
        <div class="flex items-center gap-1" title="Simulation speed (time acceleration)">
          <button class="rounded bg-slate-800 px-2 py-1" @click="store.stepTimeScale(-1)">−</button>
          <span class="w-20 text-center font-mono">sim ×{{ store.timeScale }}</span>
          <button class="rounded bg-slate-800 px-2 py-1" @click="store.stepTimeScale(1)">+</button>
        </div>
        <button class="rounded bg-slate-800 px-2 py-1" @click="store.paused = !store.paused">{{ store.paused ? '▶ Resume' : '❚❚ Pause' }}</button>
        <button class="rounded bg-slate-800 px-2 py-1" @click="store.reset()">↺ Reset</button>
        <button class="rounded px-2 py-1" :class="store.world.autoRefuel ? 'bg-green-800' : 'bg-slate-800'" title="Refill automatically below 15 % fuel" @click="store.toggleAutoRefuel()">⛽ Auto-refuel {{ store.world.autoRefuel ? 'ON' : 'OFF' }}</button>
        <button v-if="!store.world.autoRefuel" class="rounded bg-slate-800 px-2 py-1" title="Fill the tanks to 100 %" @click="store.refuel()">⛽ Refuel now</button>
      </div>
    </div>
    <div data-test="status" class="flex flex-wrap gap-3 font-mono text-[11px] text-slate-300">
      <span>IAS {{ store.world.ac.iasKt.toFixed(0) }}</span>
      <span>ALT {{ store.world.ac.altFt.toFixed(0) }}</span>
      <span>HDG {{ store.world.ac.hdgDeg.toFixed(0).padStart(3, '0') }}</span>
      <span>PITCH {{ store.world.ac.pitchDeg.toFixed(1) }}</span>
      <span>BANK {{ store.world.ac.bankDeg.toFixed(1) }}</span>
      <span>THR {{ (store.world.ac.throttle * 100).toFixed(0) }}%</span>
      <span :class="store.world.ac.fuelPct < 10 ? 'text-red-400' : ''">FUEL {{ store.world.ac.fuelPct.toFixed(0) }}% ({{ endurance }} left)</span>
      <span v-if="stalled" class="animate-pulse font-bold text-red-400">STALL</span>
      <span :class="store.world.ac.onGround ? 'text-amber-300' : 'text-green-400'">{{ store.world.ac.onGround ? `ON GROUND${store.world.ac.iasKt < store.world.profile.rotateKt ? ` · rotate at ${store.world.profile.rotateKt} kt` : ''}` : 'AIRBORNE' }}</span>
      <span v-if="store.paused" class="text-amber-400">PAUSED</span>
      <span v-if="store.world.lastTouchdown" :class="store.world.lastTouchdown.result === 'LANDED' ? 'text-green-400' : 'text-red-400'" :title="store.world.lastTouchdown.reasons.join('; ')">
        TOUCHDOWN {{ store.world.lastTouchdown.result }}{{ store.world.lastTouchdown.runwayIdent ? ` ${store.world.lastTouchdown.runwayIdent}` : '' }} · {{ Math.abs(store.world.lastTouchdown.vsFpm).toFixed(0) }} fpm · {{ Math.abs(store.world.lastTouchdown.lateralM).toFixed(0) }} m {{ store.world.lastTouchdown.lateralM >= 0 ? 'R' : 'L' }}
      </span>
    </div>
    <p class="text-[11px] text-slate-500">Keyboard: W/S stick forward/back (nose down/up) · A/D roll · Q/E yaw (rudder, steers on the ground) · ↑/↓ or +/− throttle · G gear · F flaps · P pause · R reset. Rotate speed depends on the aircraft. Any W/S/A/D/Q/E input disengages the journey autopilot.</p>
  </div>
</template>
