<script setup lang="ts">
import { ref, watch } from 'vue'
import { wrap360 } from '../../../shared/utils/units'
import type { VorOutput } from '../../../shared/types'
import { useCanvas } from '../../composables/useCanvas'
import { cdiNeedlePx } from './gauges'
import { dial, label, tick } from './dial'

const props = defineProps<{ vor: VorOutput | undefined; obsDeg: number }>()
const emit = defineEmits<{ obs: [deg: number] }>()
const canvas = ref<HTMLCanvasElement | null>(null)

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const rot = -props.obsDeg
  for (let a = 0; a < 360; a += 10) tick(d, a + rot, a % 30 === 0 ? 0.12 : 0.06)
  for (let a = 0; a < 360; a += 30) label(d, a + rot, String(a / 10), 0.75, 0.12)
  ctx.fillStyle = '#f97316'
  ctx.beginPath(); ctx.moveTo(d.cx, d.cy - d.r * 0.98); ctx.lineTo(d.cx - 6, d.cy - d.r * 0.85); ctx.lineTo(d.cx + 6, d.cy - d.r * 0.85); ctx.fill()
  const half = d.r * 0.5
  ctx.fillStyle = '#e5e7eb'
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue
    ctx.beginPath(); ctx.arc(d.cx + (i / 5) * half, d.cy, 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(d.cx, d.cy, 5, 0, Math.PI * 2); ctx.stroke()
  const v = props.vor
  const valid = !!v?.valid && v.toFrom !== 'OFF'
  const nx = d.cx + cdiNeedlePx(valid ? v!.cdiFrac : 0, half)
  ctx.strokeStyle = valid ? '#f8fafc' : '#64748b'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(nx, d.cy - d.r * 0.55); ctx.lineTo(nx, d.cy + d.r * 0.55); ctx.stroke()
  ctx.font = `bold ${Math.round(d.r * 0.13)}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  if (!valid) {
    ctx.fillStyle = '#dc2626'; ctx.fillRect(d.cx + d.r * 0.2, d.cy - d.r * 0.42, d.r * 0.38, d.r * 0.18)
    ctx.fillStyle = '#fff'; ctx.fillText('OFF', d.cx + d.r * 0.39, d.cy - d.r * 0.3)
  }
  else {
    ctx.fillStyle = '#e5e7eb'
    ctx.fillText(v!.toFrom === 'TO' ? '▲ TO' : '▼ FR', d.cx + d.r * 0.36, d.cy - d.r * 0.3)
  }
  ctx.fillStyle = '#93c5fd'
  ctx.fillText(v?.valid ? v.ident : '---', d.cx, d.cy + d.r * 0.4)
  ctx.fillStyle = '#e5e7eb'
  ctx.fillText(`OBS ${String(Math.round(wrap360(props.obsDeg))).padStart(3, '0')}`, d.cx, d.cy + d.r * 0.62)
})
watch(() => [props.vor, props.obsDeg], redraw)

function turn(e: MouseEvent, dir: number): void {
  emit('obs', wrap360(props.obsDeg + dir * (e.shiftKey ? 10 : 1)))
}
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <canvas ref="canvas" class="aspect-square w-full" />
    <div class="flex gap-1 text-xs">
      <button class="rounded bg-slate-800 px-2" title="OBS −1 (shift −10)" @click="turn($event, -1)">◀ OBS</button>
      <button class="rounded bg-slate-800 px-2" title="OBS +1 (shift +10)" @click="turn($event, 1)">OBS ▶</button>
    </div>
  </div>
</template>
