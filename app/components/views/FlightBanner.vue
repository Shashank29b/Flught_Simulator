<script setup lang="ts">
import { computed } from 'vue'
import type { World } from '../../sim/engine'
import { objectiveText } from '../../sim/objectives'

const props = defineProps<{ world: World; title: string; scoreTotal: number | null; error: string }>()
defineEmits<{ abort: []; restart: [] }>()
const text = computed(() => (props.world.objective ? objectiveText(props.world.objective, props.world.objProgress) : 'Free flight'))
const done = computed(() => props.world.done)
const t = computed(() => {
  const s = Math.floor(props.world.simMs / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
</script>

<template>
  <div class="relative rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
    <div class="flex items-center gap-3">
      <span class="font-semibold text-sky-300">{{ title }}</span>
      <span class="text-slate-300">{{ text }}</span>
      <span class="ml-auto font-mono text-slate-500">{{ t }}</span>
      <button v-if="!done" class="rounded bg-red-900 px-2 py-0.5 hover:bg-red-800" @click="$emit('abort')">End flight</button>
    </div>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
    <div v-if="done" class="mt-2 rounded border p-3" :class="done.result === 'CRASHED' ? 'border-red-700 bg-red-950' : 'border-green-700 bg-green-950'">
      <div class="text-lg font-bold">{{ done.result }}</div>
      <ul v-if="done.reasons?.length" class="list-inside list-disc text-xs text-slate-300">
        <li v-for="r in done.reasons" :key="r">{{ r }}</li>
      </ul>
      <div v-if="done.landing" class="font-mono text-xs text-slate-300">Centreline offset {{ done.landing.lateralM.toFixed(1) }} m · touchdown {{ Math.abs(done.landing.vsFpm).toFixed(0) }} fpm</div>
      <div class="mt-1">Score: <span class="font-bold">{{ scoreTotal ?? '…' }}</span></div>
      <div class="mt-2 flex gap-2">
        <button class="rounded bg-sky-700 px-3 py-1" @click="$emit('restart')">Fly again</button>
        <NuxtLink to="/scenarios" class="rounded bg-slate-700 px-3 py-1">Scenarios</NuxtLink>
        <NuxtLink to="/flights" class="rounded bg-slate-700 px-3 py-1">Flight log</NuxtLink>
      </div>
    </div>
  </div>
</template>
