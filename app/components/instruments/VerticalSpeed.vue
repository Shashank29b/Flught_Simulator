<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { vsiNeedleDeg } from './gauges'
import { dial, label, needle, tick, title } from './dial'

const props = defineProps<{ vsFpm: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
/** 0 fpm points to 9 o'clock (270° clockwise from 12), climbs rotate clockwise (up). */
const at = (vs: number) => 270 + vsiNeedleDeg(vs)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  for (let v = -2000; v <= 2000; v += 250) {
    tick(d, at(v), v % 500 === 0 ? 0.14 : 0.07)
    if (v % 1000 === 0) label(d, at(v), String(Math.abs(v) / 1000))
  }
  title(d, 'VS ×1000 FPM', 0.4)
  needle(d, at(props.vsFpm), 0.8, 3)
})
watch(() => props.vsFpm, redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
