<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { headingCardRotation } from './gauges'
import { dial, label, tick } from './dial'

const props = defineProps<{ hdgDeg: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const NAMES: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const rot = headingCardRotation(props.hdgDeg)
  for (let a = 0; a < 360; a += 5) tick(d, a + rot, a % 10 === 0 ? 0.12 : 0.06)
  for (let a = 0; a < 360; a += 30) label(d, a + rot, NAMES[a] ?? String(a / 10), 0.7, 0.15)
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(d.cx, d.cy - d.r); ctx.lineTo(d.cx, d.cy - d.r * 0.78); ctx.stroke()
  ctx.strokeStyle = '#facc15'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(d.cx, d.cy - d.r * 0.35); ctx.lineTo(d.cx, d.cy + d.r * 0.3)
  ctx.moveTo(d.cx - d.r * 0.25, d.cy - d.r * 0.05); ctx.lineTo(d.cx + d.r * 0.25, d.cy - d.r * 0.05)
  ctx.moveTo(d.cx - d.r * 0.1, d.cy + d.r * 0.25); ctx.lineTo(d.cx + d.r * 0.1, d.cy + d.r * 0.25)
  ctx.stroke()
  ctx.fillStyle = '#e5e7eb'
  ctx.font = `${Math.round(d.r * 0.13)}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(props.hdgDeg) % 360}`.padStart(3, '0'), d.cx, d.cy + d.r * 0.5)
})
watch(() => props.hdgDeg, redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
