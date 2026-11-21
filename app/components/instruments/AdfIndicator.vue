<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdfOutput } from '../../../shared/types'
import { useCanvas } from '../../composables/useCanvas'
import { dial, label, needle, tick, title } from './dial'

const props = defineProps<{ adf: AdfOutput | undefined }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  for (let a = 0; a < 360; a += 10) tick(d, a, a % 30 === 0 ? 0.12 : 0.06)
  for (let a = 0; a < 360; a += 30) label(d, a, String(a / 10), 0.72, 0.12)
  title(d, props.adf?.valid ? `ADF ${props.adf.ident}` : 'ADF ---', 0.35)
  needle(d, props.adf?.relBearingDeg ?? 90, 0.8, 3, props.adf?.valid ? '#facc15' : '#64748b')
})
watch(() => props.adf, redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
