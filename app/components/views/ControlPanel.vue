<script setup lang="ts">
import { useSimStore } from '../../stores/sim'
import { PRESETS } from '../../sim/presets'

const store = useSimStore()
const FLAPS = [0, 10, 20, 30] as const
const yoke = [
  { key: 'ArrowDown', label: '▲ Pitch up', cls: 'col-start-2' },
  { key: 'ArrowLeft', label: '◀ Roll L', cls: 'col-start-1' },
  { key: 'ArrowRight', label: 'Roll R ▶', cls: 'col-start-3' },
  { key: 'ArrowUp', label: '▼ Pitch down', cls: 'col-start-2' },
]
const hold = (k: string, d: boolean) => store.holdKey(k, d)
</script>

<template>
  <div class="space-y-2 rounded border border-slate-800 bg-slate-950 p-2 text-xs">
    <div class="flex flex-wrap gap-1">
      <span class="self-center text-slate-400">Start at:</span>
      <button v-for="p in PRESETS" :key="p.id" class="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700" @click="store.applyPreset(p)">{{ p.label }}</button>
    </div>
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <div class="grid w-56 grid-cols-3 gap-1 select-none">
        <button
v-for="b in yoke" :key="b.key" :class="b.cls" class="rounded bg-slate-800 px-1 py-2 active:bg-sky-700"
          @pointerdown.prevent="hold(b.key, true)" @pointerup="hold(b.key, false)" @pointerleave="hold(b.key, false)" @pointercancel="hold(b.key, false)">{{ b.label }}</button>
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
        <button class="rounded bg-slate-800 px-2 py-1" @click="store.paused = !store.paused">{{ store.paused ? '▶ Resume' : '❚❚ Pause' }}</button>
        <button class="rounded bg-slate-800 px-2 py-1" @click="store.reset()">↺ Reset</button>
      </div>
    </div>
    <div data-test="status" class="flex flex-wrap gap-3 font-mono text-[11px] text-slate-300">
      <span>IAS {{ store.world.ac.iasKt.toFixed(0) }}</span>
      <span>ALT {{ store.world.ac.altFt.toFixed(0) }}</span>
      <span>HDG {{ store.world.ac.hdgDeg.toFixed(0).padStart(3, '0') }}</span>
      <span>PITCH {{ store.world.ac.pitchDeg.toFixed(1) }}</span>
      <span>BANK {{ store.world.ac.bankDeg.toFixed(1) }}</span>
      <span>THR {{ (store.world.ac.throttle * 100).toFixed(0) }}%</span>
      <span>FUEL {{ store.world.ac.fuelPct.toFixed(0) }}%</span>
      <span :class="store.world.ac.onGround ? 'text-amber-300' : 'text-green-400'">{{ store.world.ac.onGround ? `ON GROUND${store.world.ac.iasKt < 65 ? ' · rotate at 65 kt' : ''}` : 'AIRBORNE' }}</span>
      <span v-if="store.paused" class="text-amber-400">PAUSED</span>
    </div>
    <p class="text-[11px] text-slate-500">Keyboard: arrows pitch/roll (↓ = nose up) · W/S throttle · G gear · F flaps · P pause · R reset. On the runway, roll and pitch work only above 65 kt.</p>
  </div>
</template>
