<script setup lang="ts">
import { computed, ref } from 'vue'
import { REF } from '../../../shared/utils/geo'
import { runwaysToLocal, type AirportRow } from '../../composables/useNavData'
import TrackPlot from '../../components/views/TrackPlot.vue'
import LineChart from '../../components/views/LineChart.vue'

definePageMeta({ middleware: 'auth' })

interface Sample { tMs: number; x: number; y: number; altFt: number; hdgDeg: number; iasKt: number; vsFpm: number; nav: { locDevDeg?: number; gsDevDeg?: number; cdiDevDeg?: number; dmeNm?: number } }
interface Replay {
  flight: { id: string; startedAt: string; endedAt: string | null; result: string }
  scenario: { id: number; title: string } | null
  samples: Sample[]
  score: { total: number; details: Record<string, number> } | null
}
const route = useRoute()
const { data, error } = await useFetch<Replay>(`/api/flights/${route.params.id}`)
const { data: vobl } = await useFetch<AirportRow>('/api/airports/VOBL')
const runways = computed(() => (vobl.value ? runwaysToLocal([vobl.value], REF) : []))
const samples = computed(() => data.value?.samples ?? [])
const cursor = ref(0)
const t = computed(() => samples.value.map(s => s.tMs / 1000))
const cur = computed(() => samples.value[cursor.value])
const duration = computed(() => {
  const s = Math.round((samples.value.at(-1)?.tMs ?? 0) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const LABELS: Record<string, string> = { centreline: 'Centreline (max 40)', touchdown: 'Touchdown (max 30)', tracking: 'Localiser tracking (max 30)', lateralM: 'Offset from centreline (m)', vsFpm: 'Sink rate at touchdown (fpm)', meanAbsLocFrac: 'Mean |LOC deflection| last 4 NM', objective: 'Objective completed' }
const resultClass = (r?: string) => (r === 'LANDED' || r === 'COMPLETED' ? 'bg-green-700' : r === 'CRASHED' ? 'bg-red-700' : 'bg-slate-700')
</script>

<template>
  <section v-if="error" class="space-y-2">
    <p class="text-red-400">Flight not found or not yours.</p>
    <NuxtLink to="/flights" class="text-sky-400">Back to the flight log</NuxtLink>
  </section>
  <section v-else-if="data" class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <NuxtLink to="/flights" class="text-sm text-sky-400">← Flight log</NuxtLink>
      <h1 class="text-2xl font-bold">{{ data.scenario?.title ?? 'Flight' }}</h1>
      <span class="rounded px-2 py-0.5 text-sm font-semibold" :class="resultClass(data.flight.result)">{{ data.flight.result }}</span>
      <span class="text-sm text-slate-400">{{ new Date(data.flight.startedAt).toLocaleString() }} · {{ duration }} sim time · {{ samples.length }} samples</span>
      <span class="ml-auto text-3xl font-bold">{{ data.score?.total ?? '–' }}<span class="text-base text-slate-400"> / 100</span></span>
    </div>
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div class="space-y-3">
        <ClientOnly><TrackPlot :points="samples" :runways="runways" :cursor="cursor" /></ClientOnly>
        <div v-if="samples.length" class="space-y-1">
          <input v-model.number="cursor" type="range" min="0" :max="samples.length - 1" class="w-full accent-yellow-400" aria-label="Replay position">
          <div v-if="cur" class="flex flex-wrap gap-3 font-mono text-xs text-slate-300">
            <span>t {{ (cur.tMs / 1000).toFixed(1) }} s</span><span>ALT {{ cur.altFt.toFixed(0) }}</span><span>IAS {{ cur.iasKt.toFixed(0) }}</span>
            <span>VS {{ cur.vsFpm.toFixed(0) }}</span><span>HDG {{ cur.hdgDeg.toFixed(0) }}</span>
            <span v-if="cur.nav.locDevDeg !== undefined">LOC {{ cur.nav.locDevDeg.toFixed(2) }}°</span>
            <span v-if="cur.nav.gsDevDeg !== undefined">GS {{ cur.nav.gsDevDeg.toFixed(2) }}°</span>
          </div>
        </div>
        <div v-if="data.score" class="rounded border border-slate-800 bg-slate-900 p-3 text-sm">
          <h2 class="mb-1 font-semibold">Score breakdown</h2>
          <table class="w-full">
            <tr v-for="(v, k) in data.score.details" :key="k" class="border-t border-slate-800"><td class="py-1 text-slate-400">{{ LABELS[k] ?? k }}</td><td class="text-right font-mono">{{ v }}</td></tr>
          </table>
        </div>
      </div>
      <ClientOnly>
        <div class="space-y-2">
          <LineChart title="Altitude" unit="ft" :t="t" :values="samples.map(s => s.altFt)" :cursor="cursor" />
          <LineChart title="Localiser deviation (+ = fly right)" unit="°" :t="t" :values="samples.map(s => s.nav.locDevDeg ?? null)" :cursor="cursor" zero-line :range="[-2.5, 2.5]" />
          <LineChart title="Glide-slope deviation (+ = fly up)" unit="°" :t="t" :values="samples.map(s => s.nav.gsDevDeg ?? null)" :cursor="cursor" zero-line :range="[-0.7, 0.7]" />
          <LineChart title="Indicated airspeed" unit="kt" :t="t" :values="samples.map(s => s.iasKt)" :cursor="cursor" />
        </div>
      </ClientOnly>
    </div>
  </section>
</template>
