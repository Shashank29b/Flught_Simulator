<script setup lang="ts">
import { watch } from 'vue'
import { useSimStore } from '../../stores/sim'
import { createWorld } from '../../sim/engine'
import { useNavData } from '../../composables/useNavData'
import { useKeyboard } from '../../composables/useKeyboard'
import { useSimLoop } from '../../composables/useSimLoop'
import MapView from '../../components/views/MapView.vue'

definePageMeta({ layout: 'cockpit' })

const store = useSimStore()
const nav = useNavData()

watch([nav.stations, nav.runways], ([stations, runways]) => {
  if (stations.length) store.load(createWorld({ stations, runways }))
}, { immediate: true })

useKeyboard()
useSimLoop()
</script>

<template>
  <div class="grid h-[calc(100vh-37px)] grid-rows-[1fr_auto] gap-2 p-2">
    <div class="min-h-0 overflow-hidden rounded border border-slate-800">
      <ClientOnly><MapView :world="store.world" :trail="store.trail" /></ClientOnly>
    </div>
    <div class="flex flex-wrap gap-4 rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm">
      <span>IAS {{ store.world.ac.iasKt.toFixed(0) }} kt</span>
      <span>ALT {{ store.world.ac.altFt.toFixed(0) }} ft</span>
      <span>HDG {{ store.world.ac.hdgDeg.toFixed(0).padStart(3, '0') }}°</span>
      <span>VS {{ store.world.ac.vsFpm.toFixed(0) }} fpm</span>
      <span>THR {{ (store.world.ac.throttle * 100).toFixed(0) }}%</span>
      <span>{{ store.world.ac.gearDown ? 'GEAR DN' : 'GEAR UP' }} · FLAPS {{ store.world.ac.flapsDeg }}</span>
      <span v-if="store.paused" class="text-amber-400">PAUSED</span>
    </div>
  </div>
</template>
