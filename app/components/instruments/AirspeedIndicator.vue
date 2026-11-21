<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { airspeedNeedleDeg } from './gauges'
import { dial, label, needle, tick, title } from './dial'

const props = withDefaults(defineProps<{ iasKt: number; maxKt?: number; stallKt?: number; flapStallKt?: number; vneKt?: number }>(), { maxKt: 200, stallKt: 55, flapStallKt: 50, vneKt: 180 })
const at = (v: number) => airspeedNeedleDeg(v, props.maxKt)
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const arc = (from: number, to: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = d.r * 0.07
    ctx.beginPath()
    ctx.arc(d.cx, d.cy, d.r * 0.88, ((at(from) - 90) * Math.PI) / 180, ((at(to) - 90) * Math.PI) / 180)
    ctx.stroke()
  }
  arc(props.flapStallKt, props.stallKt * 1.6, '#e5e7eb')
  arc(props.stallKt, props.vneKt * 0.9, '#22c55e')
  arc(props.vneKt * 0.9, props.vneKt, '#eab308')
  const minor = props.maxKt > 250 ? 20 : 10
  for (let v = 0; v <= props.maxKt; v += minor) {
    tick(d, at(v), v % (minor * 2) === 0 ? 0.14 : 0.08)
    if (v % (minor * 4) === 0) label(d, at(v), String(v))
  }
  tick(d, at(props.vneKt), 0.2, 3, '#ef4444')
  title(d, 'KNOTS')
  needle(d, at(props.iasKt), 0.8, 3)
})
watch(() => [props.iasKt, props.maxKt], redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
