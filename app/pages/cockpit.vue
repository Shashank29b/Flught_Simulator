<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSimStore } from '../stores/sim'
import { createWorld } from '../sim/engine'
import { PRESETS } from '../sim/presets'
import { useNavData } from '../composables/useNavData'
import { useKeyboard } from '../composables/useKeyboard'
import { useSimLoop } from '../composables/useSimLoop'
import CockpitPanel from '../components/views/CockpitPanel.vue'
import JourneyPanel from '../components/views/JourneyPanel.vue'
import InfoTap from '../components/views/InfoTap.vue'

definePageMeta({ layout: 'cockpit' })

const store = useSimStore()
const start = PRESETS.find(p => p.id === 'runway')!
store.load(createWorld({ ac: start.ac, radios: { nav1MHz: 115.5, obsDeg: 180, adfKHz: 223 } }))
const { navCenter } = storeToRefs(store)
const nav = useNavData(navCenter)
watch(nav.raw, raw => store.setNavData(raw), { immediate: true })

useKeyboard()
useSimLoop()
</script>

<template>
  <div class="flex h-[calc(100vh-37px)] flex-col gap-2 p-2">
    <div class="flex items-center gap-3 rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm">
      <span class="font-semibold text-sky-300">Cockpit · free flight at VOBL Bengaluru</span>
      <span class="text-xs text-slate-500">All instruments, radios and controls in one view · <b class="text-slate-300">triple-tap any panel for an explanation</b> · scoring is in Test mode.</span>
      <NuxtLink to="/scenarios" class="ml-auto rounded bg-slate-800 px-2 py-0.5 text-xs hover:bg-slate-700">Test mode →</NuxtLink>
    </div>
    <ClientOnly><InfoTap id="journey"><JourneyPanel /></InfoTap></ClientOnly>
    <CockpitPanel />
  </div>
</template>
