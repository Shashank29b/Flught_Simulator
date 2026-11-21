<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { airspeedNeedleDeg } from './gauges'
import { dial, label, needle, tick, title } from './dial'

const props = defineProps<{ iasKt: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const arc = (from: number, to: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = d.r * 0.07
    ctx.beginPath()
    ctx.arc(d.cx, d.cy, d.r * 0.88, ((airspeedNeedleDeg(from) - 90) * Math.PI) / 180, ((airspeedNeedleDeg(to) - 90) * Math.PI) / 180)
    ctx.stroke()
  }
  arc(50, 85, '#e5e7eb')
  arc(55, 160, '#22c55e')
  arc(160, 180, '#eab308')
  for (let v = 0; v <= 200; v += 10) {
    tick(d, airspeedNeedleDeg(v), v % 20 === 0 ? 0.14 : 0.08)
    if (v % 40 === 0) label(d, airspeedNeedleDeg(v), String(v))
  }
  tick(d, airspeedNeedleDeg(180), 0.2, 3, '#ef4444')
  title(d, 'KNOTS')
  needle(d, airspeedNeedleDeg(props.iasKt), 0.8, 3)
})
watch(() => props.iasKt, redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
