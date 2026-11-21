<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { EXPLANATIONS } from './explanations'

const props = defineProps<{ id: string }>()
const open = ref(false)
let taps: number[] = []

/** Three taps/clicks within 700 ms open the explanation. Taps on buttons, inputs and the map are ignored. */
function onTap(e: PointerEvent): void {
  const t = e.target as HTMLElement | null
  if (t?.closest('button, input, select, a, label, .leaflet-container')) return
  const now = performance.now()
  taps = [...taps.filter(x => now - x < 700), now]
  if (taps.length >= 3) {
    taps = []
    open.value = true
  }
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
const info = EXPLANATIONS[props.id]
</script>

<template>
  <div class="relative" :data-info="id" @pointerup="onTap">
    <slot />
    <Teleport to="body">
      <div v-if="open && info" class="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 p-4" @click.self="open = false">
        <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-sky-800 bg-slate-900 p-5 text-sm text-slate-200 shadow-2xl" role="dialog" :aria-label="info.title">
          <div class="mb-2 flex items-start gap-2">
            <h2 class="text-lg font-bold text-sky-300">{{ info.title }}</h2>
            <button class="ml-auto rounded bg-slate-800 px-2 hover:bg-slate-700" aria-label="Close" @click="open = false">✕</button>
          </div>
          <p class="mb-3">{{ info.what }}</p>
          <h3 class="font-semibold text-slate-300">How to read it</h3>
          <ul class="mb-3 list-inside list-disc space-y-0.5 text-slate-300">
            <li v-for="r in info.read" :key="r">{{ r }}</li>
          </ul>
          <h3 class="font-semibold text-slate-300">How it works</h3>
          <p class="mb-3 text-slate-300">{{ info.how }}</p>
          <template v-if="info.controls">
            <h3 class="font-semibold text-slate-300">Controls</h3>
            <p class="text-slate-300">{{ info.controls }}</p>
          </template>
          <p class="mt-4 text-[11px] text-slate-500">Tip: triple-tap any cockpit panel to see its explanation. Esc or ✕ closes.</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
