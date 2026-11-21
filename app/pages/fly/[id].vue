<script setup lang="ts">
import { watch } from 'vue'
import type { ScenarioDTO } from '../../../shared/types'
import { useSimStore } from '../../stores/sim'
import { buildScenarioWorld } from '../../composables/useScenarioWorld'
import { useFlightSession } from '../../composables/useFlightSession'
import FlightBanner from '../../components/views/FlightBanner.vue'
import { useNavData } from '../../composables/useNavData'
import { useKeyboard } from '../../composables/useKeyboard'
import { useSimLoop } from '../../composables/useSimLoop'
import MapView from '../../components/views/MapView.vue'
import AirspeedIndicator from '../../components/instruments/AirspeedIndicator.vue'
import AttitudeIndicator from '../../components/instruments/AttitudeIndicator.vue'
import Altimeter from '../../components/instruments/Altimeter.vue'
import HeadingIndicator from '../../components/instruments/HeadingIndicator.vue'
import VerticalSpeed from '../../components/instruments/VerticalSpeed.vue'
import CDI from '../../components/instruments/CDI.vue'
import DmeReadout from '../../components/instruments/DmeReadout.vue'
import NavRadio from '../../components/radios/NavRadio.vue'
import RMI from '../../components/instruments/RMI.vue'
import AdfIndicator from '../../components/instruments/AdfIndicator.vue'

definePageMeta({ layout: 'cockpit', middleware: 'auth' })

const route = useRoute()
const scenarioId = Number(route.params.id)
const store = useSimStore()
const nav = useNavData()
const session = useFlightSession()
const { data: scenario } = await useFetch<ScenarioDTO>(`/api/scenarios/${scenarioId}`)

function begin(): void {
  if (!scenario.value || !nav.stations.value.length) return
  store.load(buildScenarioWorld(scenario.value, nav.stations.value, nav.runways.value))
  if (import.meta.client) void session.start(scenarioId)
}

watch([scenario, nav.stations], begin, { immediate: true })
watch(() => store.world.done, (d) => {
  if (d) void session.end(d.result, d.landing)
})

async function abort(): Promise<void> {
  store.world = { ...store.world, done: { result: 'ABORTED' } }
}

useKeyboard()
useSimLoop()
</script>

<template>
  <div class="grid h-[calc(100vh-37px)] grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <div class="flex min-h-[300px] flex-col gap-2">
      <FlightBanner :world="store.world" :title="scenario?.title ?? 'Flight'" :score-total="session.scoreTotal.value" :error="session.error.value" @abort="abort" @restart="begin" />
      <div class="min-h-0 flex-1 overflow-hidden rounded border border-slate-800">
      <ClientOnly><MapView :world="store.world" :trail="store.trail" /></ClientOnly>
      </div>
    </div>
    <div class="flex min-h-0 flex-col gap-2 overflow-y-auto">
      <ClientOnly>
        <div class="grid grid-cols-3 gap-2 rounded border border-slate-800 bg-slate-950 p-2">
          <AirspeedIndicator :ias-kt="store.world.ac.iasKt" />
          <AttitudeIndicator :pitch-deg="store.world.ac.pitchDeg" :bank-deg="store.world.ac.bankDeg" />
          <Altimeter :alt-ft="store.world.ac.altFt" />
          <VerticalSpeed :vs-fpm="store.world.ac.vsFpm" />
          <HeadingIndicator :hdg-deg="store.world.ac.hdgDeg" />
          <CDI :vor="store.world.nav.vor1" :obs-deg="store.world.radios.obsDeg" @obs="store.setRadio({ obsDeg: $event })" />
          <RMI :hdg-deg="store.world.ac.hdgDeg" :vor="store.world.nav.vor1" :adf="store.world.nav.adf" />
          <AdfIndicator :adf="store.world.nav.adf" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <NavRadio :active="store.world.radios.nav1MHz" @tune="store.setRadio({ nav1MHz: $event })" />
          <DmeReadout :dme="store.world.nav.dme1" :gs-kt="store.world.ac.gsKt" />
          <NavRadio label="ADF" :active="store.world.radios.adfKHz" :min="190" :max="1750" :fine="1" :coarse="10" :decimals="0" unit="kHz" @tune="store.setRadio({ adfKHz: $event })" />
        </div>
      </ClientOnly>
      <div class="flex flex-wrap gap-4 rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs">
        <span>THR {{ (store.world.ac.throttle * 100).toFixed(0) }}%</span>
        <span>{{ store.world.ac.gearDown ? 'GEAR DN' : 'GEAR UP' }}</span>
        <span>FLAPS {{ store.world.ac.flapsDeg }}</span>
        <span>FUEL {{ store.world.ac.fuelPct.toFixed(0) }}%</span>
        <span>{{ store.world.ac.onGround ? 'ON GROUND' : 'AIRBORNE' }}</span>
        <span v-if="store.paused" class="text-amber-400">PAUSED</span>
      </div>
    </div>
  </div>
</template>
