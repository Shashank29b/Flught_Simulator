<script setup lang="ts">
import { ref, watch } from 'vue'
import type { World } from '../../sim/engine'
import { useCanvas } from '../../composables/useCanvas'
import { drawAircraft, drawRunway, drawStation } from './mapDraw'

const props = defineProps<{ world: World; trail: { x: number; y: number }[]; extra?: (ctx: CanvasRenderingContext2D, project: (x: number, y: number) => [number, number]) => void }>()
const spans = [5, 10, 20, 40, 80, 160]
const spanIdx = ref(3)
const canvas = ref<HTMLCanvasElement | null>(null)

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const ac = props.world.ac
  const pxPerNm = w / spans[spanIdx.value]!
  const project = (x: number, y: number): [number, number] => [w / 2 + (x - ac.x) * pxPerNm, h / 2 - (y - ac.y) * pxPerNm]
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  const grid = spans[spanIdx.value]! >= 40 ? 10 : 5
  const x0 = Math.floor((ac.x - w / 2 / pxPerNm) / grid) * grid
  const y0 = Math.floor((ac.y - h / 2 / pxPerNm) / grid) * grid
  for (let gx = x0; gx < ac.x + w / pxPerNm; gx += grid) {
    const [sx] = project(gx, 0)
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke()
  }
  for (let gy = y0; gy < ac.y + h / pxPerNm; gy += grid) {
    const [, sy] = project(0, gy)
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke()
  }
  for (const r of props.world.runways) drawRunway(ctx, r, project)
  for (const s of props.world.stations) drawStation(ctx, s, project)
  props.extra?.(ctx, project)
  if (props.trail.length) {
    ctx.strokeStyle = '#a3e635'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    props.trail.forEach((p, i) => {
      const [sx, sy] = project(p.x, p.y)
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    })
    ctx.lineTo(w / 2, h / 2)
    ctx.stroke()
  }
  drawAircraft(ctx, w / 2, h / 2, ac.hdgDeg)
  // scale bar + wind
  const bar = (spans[spanIdx.value]! / 5) * pxPerNm
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath(); ctx.moveTo(12, h - 14); ctx.lineTo(12 + bar, h - 14); ctx.stroke()
  ctx.fillStyle = '#e5e7eb'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`${spans[spanIdx.value]! / 5} NM`, 12, h - 20)
  ctx.fillText(`GS ${ac.gsKt.toFixed(0)} kt  TRK ${ac.trackDeg.toFixed(0).padStart(3, '0')}°`, 12, 18)
  const wnd = props.world.wind
  if (wnd && wnd.speedKt > 0) ctx.fillText(`WIND ${wnd.fromDeg.toFixed(0).padStart(3, '0')}/${wnd.speedKt.toFixed(0)}`, 12, 32)
})

watch(() => [props.world, props.trail, spanIdx.value], redraw)
</script>

<template>
  <div class="relative h-full w-full">
    <canvas ref="canvas" class="h-full w-full" />
    <div class="absolute right-2 top-2 flex gap-1">
      <button class="rounded bg-slate-800 px-2 text-sm" @click="spanIdx = Math.max(0, spanIdx - 1)">+</button>
      <button class="rounded bg-slate-800 px-2 text-sm" @click="spanIdx = Math.min(spans.length - 1, spanIdx + 1)">−</button>
    </div>
  </div>
</template>
