<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { altHands } from './gauges'
import { dial, label, needle, tick, title } from './dial'

const props = defineProps<{ altFt: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  for (let i = 0; i < 50; i++) tick(d, i * 7.2, i % 5 === 0 ? 0.14 : 0.07)
  for (let i = 0; i < 10; i++) label(d, i * 36, String(i))
  title(d, 'ALT', 0.3)
  ctx.fillStyle = '#e5e7eb'
  ctx.font = `${Math.round(d.r * 0.14)}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(props.altFt).toString().padStart(5, ' '), d.cx, d.cy - d.r * 0.32)
  const hands = altHands(props.altFt)
  needle(d, hands.thousandsDeg, 0.5, 5)
  needle(d, hands.hundredsDeg, 0.82, 2.5)
})
watch(() => props.altFt, redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
