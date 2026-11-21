<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { ScenarioDTO } from '#shared/types'
import { useSimStore } from '../../stores/sim'
import { buildScenarioWorld } from '../../composables/useScenarioWorld'
import { useFlightSession } from '../../composables/useFlightSession'
import { useRecorder } from '../../composables/useRecorder'
import { useNavData } from '../../composables/useNavData'
import { useKeyboard } from '../../composables/useKeyboard'
import { useSimLoop } from '../../composables/useSimLoop'
import FlightBanner from '../../components/views/FlightBanner.vue'
import CockpitPanel from '../../components/views/CockpitPanel.vue'

definePageMeta({ layout: 'cockpit', middleware: 'auth' })

const route = useRoute()
const scenarioId = Number(route.params.id)
const store = useSimStore()
const { navCenter, world } = storeToRefs(store)
const nav = useNavData(navCenter)
const session = useFlightSession()
const recorder = useRecorder(world, session.flightId, session.ended)
session.beforeEnd.push(recorder.flush)
const { data: scenario, error: scenarioError } = await useFetch<ScenarioDTO>(`/api/scenarios/${scenarioId}`)

function begin(): void {
  if (!scenario.value) return
  store.load(buildScenarioWorld(scenario.value))
  store.setNavData(nav.raw.value)
  if (import.meta.client) void session.start(scenarioId)
}

watch(scenario, begin, { immediate: true })
watch(nav.raw, raw => store.setNavData(raw))
watch(() => store.world.done, (d) => {
  if (d) void session.end(d.result, d.landing)
})

function abort(): void {
  store.world = { ...store.world, done: { result: 'ABORTED' } }
}

useKeyboard()
useSimLoop()
</script>

<template>
  <div v-if="scenarioError" class="p-6">
    <p class="text-red-400">This scenario does not exist.</p>
    <NuxtLink to="/scenarios" class="text-sky-400">Back to Test mode scenarios</NuxtLink>
  </div>
  <div v-else class="flex h-[calc(100vh-37px)] flex-col gap-2 p-2">
    <FlightBanner :world="store.world" :title="`Test mode · ${scenario?.title ?? ''}`" :score-total="session.scoreTotal.value" :error="session.error.value" @abort="abort" @restart="begin" />
    <CockpitPanel />
  </div>
</template>
