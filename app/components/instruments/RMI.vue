<script setup lang="ts">
import { ref, watch } from 'vue'
import { wrap360 } from '../../../shared/utils/units'
import type { AdfOutput, VorOutput } from '../../../shared/types'
import { useCanvas } from '../../composables/useCanvas'
import { dial, label, needle, tick, title } from './dial'

const props = defineProps<{ hdgDeg: number; vor: VorOutput | undefined; adf: AdfOutput | undefined }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const rot = -props.hdgDeg
  for (let a = 0; a < 360; a += 10) tick(d, a + rot, a % 30 === 0 ? 0.12 : 0.06)
  for (let a = 0; a < 360; a += 30) label(d, a + rot, ({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' } as Record<number, string>)[a] ?? String(a / 10), 0.72, 0.12)
  ctx.fillStyle = '#f97316'
  ctx.beginPath(); ctx.moveTo(d.cx, d.cy - d.r); ctx.lineTo(d.cx - 5, d.cy - d.r * 0.88); ctx.lineTo(d.cx + 5, d.cy - d.r * 0.88); ctx.fill()
  title(d, 'RMI', 0.3)
  // needle 1 (thin, green) → VOR station; needle 2 (thick, yellow) → NDB. Invalid needles park at 3 o'clock.
  const vorTo = props.vor?.valid ? wrap360(props.vor.radialDeg + 180) + rot : 90
  const adfTo = props.adf?.valid ? props.adf.bearingToDeg + rot : 90
  needle(d, adfTo, 0.85, 5, props.adf?.valid ? '#facc15' : '#475569')
  needle(d, vorTo, 0.9, 2, props.vor?.valid ? '#4ade80' : '#475569')
})
watch(() => [props.hdgDeg, props.vor, props.adf], redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
