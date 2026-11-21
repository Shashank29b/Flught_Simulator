<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSimStore } from '../../stores/sim'
import { journeyDistanceNm, runwayRel, type Journey, type JourneyEnd, type Phase } from '../../sim/autoflight'
import type { AirportRow, RunwayRow } from '../../composables/useNavData'
import AirportPicker from './AirportPicker.vue'

const store = useSimStore()
const from = ref<{ airport: AirportRow; runway: RunwayRow } | null>(null)
const to = ref<{ airport: AirportRow; runway: RunwayRow } | null>(null)
const cruise = ref<number | null>(null)
const SCALES = [1, 2, 4, 8, 16, 32, 64]
const PHASES: [Phase, string][] = [
  ['TAKEOFF_ROLL', 'Take-off roll'], ['ROTATE', 'Rotate'], ['CLIMB', 'Climb'], ['CRUISE', 'Cruise'], ['DESCENT', 'Descent'],
  ['APPROACH', 'Approach'], ['FINAL', 'Final 3°'], ['FLARE', 'Flare'], ['ROLLOUT', 'Rollout'], ['ARRIVED', 'Arrived'],
]

const end = (p: { airport: AirportRow; runway: RunwayRow }): JourneyEnd => ({
  ident: p.airport.ident, name: p.airport.name, elevationFt: p.airport.elevationFt,
  runway: { ident: p.runway.ident, headingDeg: p.runway.headingDeg, lat: p.runway.thresholdLat, lon: p.runway.thresholdLon, lengthM: p.runway.lengthM },
})
const plan = computed<Journey | null>(() => {
  if (!from.value || !to.value) return null
  const j = { from: end(from.value), to: end(to.value), cruiseAltFt: 0 }
  const d = journeyDistanceNm(j)
  const base = Math.max(j.from.elevationFt, j.to.elevationFt)
  const jet = store.world.profile.id === 'jet'
  const auto = jet
    ? (d < 40 ? Math.ceil((base + 5000) / 1000) * 1000 : d < 120 ? Math.ceil((base + 12000) / 1000) * 1000 : d < 300 ? 25000 : 35000)
    : Math.ceil((base + (d < 40 ? 3000 : d < 120 ? 5000 : 8000)) / 500) * 500
  return { ...j, cruiseAltFt: cruise.value ?? auto }
})
watch([from, to], () => { cruise.value = null })
const distance = computed(() => (plan.value ? journeyDistanceNm(plan.value) : 0))
const problem = computed(() => {
  if (!from.value || !to.value) return 'pick both airports'
  if (from.value.airport.ident === to.value.airport.ident) return 'choose a different destination'
  const min = store.world.profile.minRunwayM
  for (const [label, p] of [['departure', from.value], ['destination', to.value]] as const) {
    if (p.runway.lengthM < min) return `${label} runway ${p.runway.ident} is ${p.runway.lengthM} m; the ${store.world.profile.id} needs ${min} m`
  }
  return ''
})

const active = computed(() => store.world.journey)
const phase = computed(() => store.world.auto?.phase ?? null)
const phaseIdx = computed(() => PHASES.findIndex(p => p[0] === phase.value))
const remaining = computed(() => {
  const j = active.value
  if (!j) return null
  const rel = runwayRel(j.to, store.world.ac, store.world.ref)
  const nm = Math.hypot(rel.along, rel.xte)
  const gs = Math.max(store.world.ac.gsKt, 1)
  return { nm, etaMin: store.world.ac.gsKt > 20 ? (nm / gs) * 60 : null }
})
const elapsed = computed(() => {
  const s = Math.floor(store.world.simMs / 1000)
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

function start(): void {
  if (plan.value && !problem.value) store.startJourney(plan.value)
}
</script>

<template>
  <div class="rounded border border-sky-900 bg-slate-950 p-2 text-sm">
    <div v-if="!active" class="flex flex-wrap items-end gap-3">
      <span class="self-center font-semibold text-sky-300">Journey (autopilot)</span>
      <AirportPicker v-model="from" label="From" initial="VOBL" />
      <AirportPicker v-model="to" label="To" />
      <label class="text-xs">
        <span class="block text-[11px] uppercase tracking-wide text-slate-400">Cruise ft</span>
        <input type="number" step="500" min="2000" max="41000" class="w-24 rounded bg-slate-800 px-2 py-1" :value="plan?.cruiseAltFt ?? ''" @change="cruise = Number(($event.target as HTMLInputElement).value)">
      </label>
      <div class="text-xs" :class="problem ? 'text-amber-300' : 'text-slate-400'">{{ problem || `${distance.toFixed(0)} NM` }}</div>
      <button class="rounded bg-sky-600 px-3 py-1.5 font-semibold hover:bg-sky-500 disabled:opacity-40" :disabled="!plan || !!problem" @click="start">Start journey ▶</button>
    </div>
    <div v-else class="space-y-1.5">
      <div class="flex flex-wrap items-center gap-3">
        <span class="font-semibold text-sky-300">{{ active.from.ident }} {{ active.from.runway.ident }} → {{ active.to.ident }} {{ active.to.runway.ident }}</span>
        <span class="text-xs text-slate-400">{{ active.to.name }} · cruise {{ active.cruiseAltFt }} ft</span>
        <span class="font-mono text-xs">{{ remaining ? `${remaining.nm.toFixed(1)} NM to go` : '' }}{{ remaining?.etaMin ? ` · ETA ${remaining.etaMin.toFixed(0)} min` : '' }} · {{ elapsed }}</span>
        <span class="ml-auto flex items-center gap-1 text-xs">
          <span class="text-slate-400">Time ×</span>
          <button v-for="s in SCALES" :key="s" class="rounded px-1.5 py-0.5" :class="store.timeScale === s ? 'bg-sky-600' : 'bg-slate-800'" @click="store.timeScale = s">{{ s }}</button>
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-1 text-[11px]">
        <span
v-for="([p, label], i) in PHASES" :key="p" class="rounded px-1.5 py-0.5"
          :class="p === phase ? 'bg-green-600 font-semibold text-white' : i < phaseIdx ? 'bg-slate-700 text-slate-300' : 'bg-slate-900 text-slate-500'">{{ label }}</span>
        <span class="ml-auto" />
        <span v-if="store.autoMessage" class="text-amber-300">{{ store.autoMessage }}</span>
        <button v-if="store.world.auto" class="rounded bg-amber-700 px-2 py-0.5 hover:bg-amber-600" @click="store.disengageAuto()">Disengage autopilot</button>
        <button v-else class="rounded bg-green-700 px-2 py-0.5 hover:bg-green-600" @click="store.engageAuto()">Engage autopilot</button>
        <button class="rounded bg-slate-700 px-2 py-0.5 hover:bg-slate-600" @click="store.endJourney()">End journey</button>
      </div>
    </div>
  </div>
</template>
