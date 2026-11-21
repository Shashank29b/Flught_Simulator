<script setup lang="ts">
import { computed } from 'vue'
import { wrap360 } from '../../../shared/utils/units'
import { useSimStore } from '../../stores/sim'
import { apFromAircraft, fma, type ApState } from '../../systems/autopilot'

const store = useSimStore()
const ap = computed<ApState>(() => store.world.ap ?? { ...apFromAircraft(store.world.ac), engaged: false })
const f = computed(() => fma(ap.value))
const journeyActive = computed(() => !!store.world.journey && !!store.world.auto)

function knob(key: 'hdgDeg' | 'altFt' | 'vsFpm' | 'spdKt', delta: number): void {
  let v = ap.value[key] + delta
  if (key === 'hdgDeg') v = wrap360(v)
  if (key === 'altFt') v = Math.max(0, Math.min(41000, v))
  if (key === 'vsFpm') v = Math.max(-6000, Math.min(6000, v))
  if (key === 'spdKt') v = Math.max(40, Math.min(store.world.profile.maxIasKt, v))
  store.setAp({ [key]: v })
}
const lit = (on: boolean, armed = false) => (on ? 'bg-green-700 text-white' : armed ? 'bg-slate-700 text-cyan-300' : 'bg-slate-800 text-slate-300')
const KNOBS = [
  { key: 'hdgDeg', label: 'HDG', fine: 1, coarse: 10, fmt: (v: number) => String(Math.round(v)).padStart(3, '0') },
  { key: 'spdKt', label: 'SPD', fine: 1, coarse: 10, fmt: (v: number) => String(Math.round(v)) },
  { key: 'altFt', label: 'ALT', fine: 100, coarse: 1000, fmt: (v: number) => String(Math.round(v)) },
  { key: 'vsFpm', label: 'V/S', fine: 100, coarse: 500, fmt: (v: number) => (v > 0 ? `+${v}` : String(v)) },
] as const
</script>

<template>
  <div class="space-y-1.5 rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs">
    <div class="flex items-center gap-2">
      <span class="font-sans font-semibold text-slate-300">Autopilot (MCP)</span>
      <span v-if="journeyActive" class="text-amber-300">journey autopilot is flying</span>
      <span class="ml-auto rounded bg-black px-2 py-0.5" :class="ap.engaged ? 'text-green-400' : 'text-slate-500'" title="Flight mode annunciator">
        {{ f.thrust }} | {{ f.lateral }} | {{ f.vertical }}<span v-if="f.armed" class="text-cyan-300"> · armed {{ f.armed }}</span>
      </span>
    </div>
    <div class="grid grid-cols-5 gap-1">
      <div class="col-span-1 flex flex-col items-center rounded bg-slate-950 p-1" title="Course for NAV (VOR); set from the runway for APP">
        <span class="text-[10px] text-slate-500">CRS</span>
        <span class="text-sm text-amber-300">{{ String(Math.round(store.world.radios.obsDeg)).padStart(3, '0') }}</span>
        <span class="flex gap-0.5">
          <button class="rounded bg-slate-800 px-1" @click="store.setRadio({ obsDeg: wrap360(store.world.radios.obsDeg - 1) })">−</button>
          <button class="rounded bg-slate-800 px-1" @click="store.setRadio({ obsDeg: wrap360(store.world.radios.obsDeg + 1) })">+</button>
        </span>
      </div>
      <div v-for="k in KNOBS" :key="k.key" class="flex flex-col items-center rounded bg-slate-950 p-1">
        <span class="text-[10px] text-slate-500">{{ k.label }}</span>
        <span class="text-sm text-amber-300">{{ k.fmt(ap[k.key]) }}</span>
        <span class="flex gap-0.5">
          <button class="rounded bg-slate-800 px-1" @click="knob(k.key, -k.coarse)">«</button>
          <button class="rounded bg-slate-800 px-1" @click="knob(k.key, -k.fine)">−</button>
          <button class="rounded bg-slate-800 px-1" @click="knob(k.key, k.fine)">+</button>
          <button class="rounded bg-slate-800 px-1" @click="knob(k.key, k.coarse)">»</button>
        </span>
      </div>
    </div>
    <div class="flex flex-wrap gap-1">
      <button class="rounded px-2 py-1 font-bold" :class="ap.engaged ? 'bg-green-600 text-white' : 'bg-slate-700'" :disabled="journeyActive" @click="store.setAp({ engaged: !ap.engaged })">AP {{ ap.engaged ? 'ON' : 'OFF' }}</button>
      <button class="rounded px-2 py-1" :class="lit(ap.athr)" @click="store.setAp({ athr: !ap.athr })">A/THR</button>
      <span class="mx-1 border-l border-slate-700" />
      <button class="rounded px-2 py-1" :class="lit(ap.lateral === 'HDG')" @click="store.setAp({ lateral: 'HDG' })">HDG</button>
      <button class="rounded px-2 py-1" :class="lit(ap.lateral === 'NAV' && ap.navCaptured, ap.lateral === 'NAV')" @click="store.setAp({ lateral: 'NAV' })">NAV</button>
      <button class="rounded px-2 py-1" :class="lit(ap.lateral === 'APP' && ap.navCaptured, ap.lateral === 'APP')" @click="store.setAp({ lateral: 'APP' })">APP</button>
      <span class="mx-1 border-l border-slate-700" />
      <button class="rounded px-2 py-1" :class="lit(ap.vertical === 'ALT')" @click="store.setAp({ vertical: 'ALT' })">ALT</button>
      <button class="rounded px-2 py-1" :class="lit(ap.vertical === 'VS')" @click="store.setAp({ vertical: 'VS' })">V/S</button>
      <span class="ml-auto self-center font-sans text-[10px] text-slate-500">Lit = active · cyan = armed · any W/S/A/D/Q/E disconnects</span>
    </div>
  </div>
</template>
