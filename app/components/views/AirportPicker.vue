<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AirportRow, RunwayRow } from '../../composables/useNavData'

const props = defineProps<{ label: string; initial?: string }>()
const model = defineModel<{ airport: AirportRow; runway: RunwayRow } | null>({ default: null })
const q = ref(props.initial ?? '')
const results = ref<AirportRow[]>([])
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function search(term: string): Promise<void> {
  if (term.trim().length < 2) { results.value = []; return }
  try { results.value = await $fetch<AirportRow[]>('/api/airports', { query: { q: term, limit: 12 } }) }
  catch { results.value = [] }
}
watch(q, (v) => {
  if (model.value && v === display(model.value.airport)) return
  open.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void search(v), 250)
})

const display = (a: AirportRow) => `${a.ident}${a.iata ? ` / ${a.iata}` : ''} · ${a.name}`
const longest = (a: AirportRow) => [...a.runways].sort((x, y) => y.lengthM - x.lengthM)[0]!

function pick(a: AirportRow): void {
  if (!a.runways.length) return
  model.value = { airport: a, runway: longest(a) }
  q.value = display(a)
  open.value = false
}
function pickRunway(id: number): void {
  const r = model.value?.airport.runways.find(x => x.id === id)
  if (model.value && r) model.value = { ...model.value, runway: r }
}
const runways = computed(() => model.value?.airport.runways ?? [])

// preselect the initial airport (e.g. VOBL)
if (props.initial) void search(props.initial).then(() => { const a = results.value.find(r => r.ident === props.initial); if (a) pick(a) })
</script>

<template>
  <div class="relative min-w-0 flex-1">
    <label class="block text-[11px] uppercase tracking-wide text-slate-400">{{ label }}</label>
    <input v-model="q" class="w-full rounded bg-slate-800 px-2 py-1 text-sm" placeholder="ICAO, IATA, name or city" @focus="open = true">
    <ul v-if="open && results.length" class="absolute z-[2000] mt-1 max-h-64 w-full overflow-y-auto rounded border border-slate-700 bg-slate-900 text-xs shadow-lg">
      <li v-for="a in results" :key="a.id">
        <button class="w-full px-2 py-1 text-left hover:bg-slate-800 disabled:opacity-40" :disabled="!a.runways.length" @click="pick(a)">
          <span class="font-semibold">{{ a.ident }}<span v-if="a.iata"> / {{ a.iata }}</span></span> · {{ a.name }}
          <span class="text-slate-400">{{ a.municipality ? `${a.municipality}, ` : '' }}{{ a.country }} · {{ a.runways.length ? `${a.runways.length / 2} rwy` : 'no runway data' }}</span>
        </button>
      </li>
    </ul>
    <div v-if="model" class="mt-1 flex items-center gap-2 text-xs">
      <span class="text-slate-400">Runway</span>
      <select class="rounded bg-slate-800 px-1 py-0.5" :value="model.runway.id" @change="pickRunway(Number(($event.target as HTMLSelectElement).value))">
        <option v-for="r in runways" :key="r.id" :value="r.id">{{ r.ident }} · {{ r.headingDeg.toFixed(0) }}° · {{ r.lengthM }} m</option>
      </select>
      <span class="text-slate-500">elev {{ model.airport.elevationFt }} ft</span>
    </div>
  </div>
</template>
