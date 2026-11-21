<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ label?: string; active: number; min?: number; max?: number; fine?: number; coarse?: number; decimals?: number; unit?: string }>(),
  { label: 'NAV 1', min: 108, max: 117.95, fine: 0.05, coarse: 1, decimals: 2, unit: 'MHz' })
const emit = defineEmits<{ tune: [freq: number] }>()
const standby = ref(props.active)

function bump(d: number): void {
  const span = props.max - props.min + props.fine
  let v = standby.value + d
  if (v > props.max + 1e-6) v -= span
  if (v < props.min - 1e-6) v += span
  standby.value = Math.round(v / props.fine) * props.fine
}

function swap(): void {
  const a = props.active
  emit('tune', Number(standby.value.toFixed(props.decimals)))
  standby.value = a
}
</script>

<template>
  <div class="rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs">
    <div class="mb-1 text-slate-400">{{ label }}</div>
    <div class="flex items-center gap-2">
      <div>
        <div class="text-[10px] text-slate-500">ACTIVE</div>
        <div class="text-lg text-green-400">{{ active.toFixed(decimals) }}</div>
      </div>
      <button class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600" title="Swap" @click="swap">⇆</button>
      <div>
        <div class="text-[10px] text-slate-500">STBY</div>
        <div class="text-lg text-amber-300">{{ standby.toFixed(decimals) }}</div>
      </div>
      <span class="text-slate-500">{{ unit }}</span>
    </div>
    <div class="mt-1 flex gap-1">
      <button class="rounded bg-slate-800 px-2" @click="bump(-coarse)">−{{ coarse }}</button>
      <button class="rounded bg-slate-800 px-2" @click="bump(coarse)">+{{ coarse }}</button>
      <button class="rounded bg-slate-800 px-2" @click="bump(-fine)">−{{ fine }}</button>
      <button class="rounded bg-slate-800 px-2" @click="bump(fine)">+{{ fine }}</button>
    </div>
  </div>
</template>
