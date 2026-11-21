<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'
import { attitudeOffsetPx } from './gauges'

const props = defineProps<{ pitchDeg: number; bankDeg: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const r = Math.min(w, h) / 2 - 4
  const cx = w / 2
  const cy = h / 2
  const ppd = r / 30
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  ctx.translate(cx, cy)
  ctx.rotate((-props.bankDeg * Math.PI) / 180)
  const off = attitudeOffsetPx(props.pitchDeg, ppd)
  ctx.fillStyle = '#0284c7'; ctx.fillRect(-2 * r, -3 * r + off, 4 * r, 3 * r)
  ctx.fillStyle = '#92400e'; ctx.fillRect(-2 * r, off, 4 * r, 3 * r)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(-2 * r, off); ctx.lineTo(2 * r, off); ctx.stroke()
  ctx.lineWidth = 1.2
  ctx.font = `${Math.round(r * 0.1)}px ui-monospace, monospace`
  ctx.fillStyle = '#fff'
  for (let p = -30; p <= 30; p += 5) {
    if (p === 0) continue
    const y = off - p * ppd
    const half = p % 10 === 0 ? r * 0.25 : r * 0.12
    ctx.beginPath(); ctx.moveTo(-half, y); ctx.lineTo(half, y); ctx.stroke()
    if (p % 10 === 0) ctx.fillText(String(Math.abs(p)), half + 4, y + 4)
  }
  ctx.restore()
  // bank scale (fixed) and pointer (rotates)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
  for (const b of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
    const a = ((b - 90) * Math.PI) / 180
    const l = b % 30 === 0 ? 0.12 : 0.06
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    ctx.lineTo(cx + Math.cos(a) * r * (1 - l), cy + Math.sin(a) * r * (1 - l))
    ctx.stroke()
  }
  const pa = ((-props.bankDeg - 90) * Math.PI) / 180
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(pa) * r * 0.86, cy + Math.sin(pa) * r * 0.86)
  ctx.lineTo(cx + Math.cos(pa + 0.06) * r * 0.74, cy + Math.sin(pa + 0.06) * r * 0.74)
  ctx.lineTo(cx + Math.cos(pa - 0.06) * r * 0.74, cy + Math.sin(pa - 0.06) * r * 0.74)
  ctx.fill()
  // aircraft symbol
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx - r * 0.15, cy); ctx.lineTo(cx - r * 0.08, cy + r * 0.08)
  ctx.moveTo(cx + r * 0.45, cy); ctx.lineTo(cx + r * 0.15, cy); ctx.lineTo(cx + r * 0.08, cy + r * 0.08)
  ctx.stroke()
  ctx.fillStyle = '#facc15'
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill()
})
watch(() => [props.pitchDeg, props.bankDeg], redraw)
</script>

<template><canvas ref="canvas" class="aspect-square w-full" /></template>
