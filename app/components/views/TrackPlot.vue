<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RunwayInfo } from '../../../shared/types'
import { NM_TO_M, deg2rad } from '../../../shared/utils/units'
import { useCanvas } from '../../composables/useCanvas'

interface Pt { x: number; y: number; altFt: number; hdgDeg: number }
const props = defineProps<{ points: Pt[]; runways: RunwayInfo[]; cursor: number }>()
const canvas = ref<HTMLCanvasElement | null>(null)

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h)
  const pts = props.points
  if (!pts.length) { ctx.fillStyle = '#64748b'; ctx.fillText('No recorded track', 10, 20); return }
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  for (const r of props.runways) { xs.push(r.x); ys.push(r.y) }
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const span = Math.max(maxX - minX, maxY - minY, 2) * 1.15
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const k = Math.min(w, h) / span
  const P = (x: number, y: number): [number, number] => [w / 2 + (x - cx) * k, h / 2 - (y - cy) * k]
  // runways
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3
  for (const r of props.runways) {
    const hd = deg2rad(r.headingDeg), len = r.lengthM / NM_TO_M
    const [ax, ay] = P(r.x, r.y), [bx, by] = P(r.x + len * Math.sin(hd), r.y + len * Math.cos(hd))
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  }
  // track coloured by altitude
  const alts = pts.map(p => p.altFt)
  const lo = Math.min(...alts), hi = Math.max(...alts, lo + 1)
  ctx.lineWidth = 2
  for (let i = 1; i < pts.length; i++) {
    const f = (pts[i]!.altFt - lo) / (hi - lo)
    ctx.strokeStyle = `hsl(${200 - f * 160}, 85%, 55%)`
    const [ax, ay] = P(pts[i - 1]!.x, pts[i - 1]!.y), [bx, by] = P(pts[i]!.x, pts[i]!.y)
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  }
  // cursor aircraft
  const c = pts[Math.min(pts.length - 1, Math.max(0, props.cursor))]!
  const [sx, sy] = P(c.x, c.y)
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(deg2rad(c.hdgDeg))
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill()
  ctx.restore()
  // scale bar
  const nm = span > 20 ? 5 : 1
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(10, h - 12); ctx.lineTo(10 + nm * k, h - 12); ctx.stroke()
  ctx.fillStyle = '#e5e7eb'; ctx.font = '11px ui-monospace'; ctx.fillText(`${nm} NM`, 10, h - 16)
  ctx.fillText(`alt ${lo.toFixed(0)}–${hi.toFixed(0)} ft (blue → orange)`, 10, 14)
})
watch(() => [props.points, props.cursor, props.runways], redraw)
</script>

<template><canvas ref="canvas" class="h-80 w-full rounded border border-slate-800" /></template>
