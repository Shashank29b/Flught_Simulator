<script setup lang="ts">
import type { MarkerOutput } from '../../../shared/types'

defineProps<{ markers: MarkerOutput | undefined; raFt: number | null | undefined; callout: string }>()
const LAMPS = [
  { key: 'om', label: 'O', on: 'bg-blue-500 shadow-[0_0_12px_#3b82f6]', title: 'Outer marker (400 Hz, dashes)' },
  { key: 'mm', label: 'M', on: 'bg-amber-400 shadow-[0_0_12px_#f59e0b]', title: 'Middle marker (1300 Hz, dot-dash)' },
  { key: 'im', label: 'I', on: 'bg-white shadow-[0_0_12px_#fff]', title: 'Inner marker (3000 Hz, dots)' },
] as const
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-3 rounded bg-slate-900/60 p-2">
    <div class="text-[10px] uppercase tracking-wide text-slate-400">Markers</div>
    <div class="flex gap-2">
      <span
v-for="l in LAMPS" :key="l.key" :title="l.title"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 font-bold text-slate-900"
        :class="markers?.[l.key] ? `${l.on} animate-pulse` : 'bg-slate-800 text-slate-500'">{{ l.label }}</span>
    </div>
    <div class="text-[10px] uppercase tracking-wide text-slate-400">Radio alt</div>
    <div class="font-mono text-2xl" :class="raFt === null || raFt === undefined ? 'text-slate-600' : raFt < 500 ? 'text-amber-300' : 'text-green-400'">
      {{ raFt === null || raFt === undefined ? '----' : Math.round(raFt) }}<span class="text-xs text-slate-500"> ft</span>
    </div>
    <div class="h-4 text-xs font-semibold text-amber-300">{{ callout }}</div>
  </div>
</template>
