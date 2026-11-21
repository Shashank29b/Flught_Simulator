<script setup lang="ts">
import { ref, watch } from 'vue'
import type { World } from '../../sim/engine'
import { toLocal } from '#shared/utils/geo'
import { NM_TO_M, deg2rad } from '#shared/utils/units'
import { useCanvas } from '../../composables/useCanvas'
import { ndProject } from './ndProject'

const props = defineProps<{ world: World; trail: { x: number; y: number }[] }>()
const RANGES = [10, 20, 40, 80, 160]
const range = ref(20)
const canvas = ref<HTMLCanvasElement | null>(null)

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const W = props.world
  const ac = W.ac
  const hdg = ac.hdgDeg
  const cx = w / 2
  const cy = h - 24
  const R = h - 50
  const k = R / range.value
  const P = (p: { x: number; y: number }) => ndProject(p, ac, hdg, k, cx, cy)
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip()
  // range rings + compass arc
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
  for (const f of [0.5, 1]) { ctx.beginPath(); ctx.arc(cx, cy, R * f, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke() }
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px ui-monospace'; ctx.textAlign = 'left'
  ctx.fillText(String(range.value / 2), cx + R * 0.5 * Math.cos(Math.PI * 1.2) - 14, cy + R * 0.5 * Math.sin(Math.PI * 1.2))
  ctx.strokeStyle = '#e5e7eb'; ctx.fillStyle = '#e5e7eb'; ctx.textAlign = 'center'; ctx.font = '11px ui-monospace'
  for (let a = 0; a < 360; a += 5) {
    const d = ((a - hdg + 540) % 360) - 180
    if (Math.abs(d) > 62) continue
    const t = deg2rad(d - 90)
    const l = a % 10 === 0 ? 10 : 5
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); ctx.lineTo(cx + Math.cos(t) * (R - l), cy + Math.sin(t) * (R - l)); ctx.stroke()
    if (a % 30 === 0) ctx.fillText(String(a / 10), cx + Math.cos(t) * (R - 20), cy + Math.sin(t) * (R - 20) + 4)
  }
  // runways + airports
  for (const r of W.runways) {
    const hd = deg2rad(r.headingDeg)
    const len = r.lengthM / NM_TO_M
    const [ax, ay] = P(r)
    const [bx, by] = P({ x: r.x + len * Math.sin(hd), y: r.y + len * Math.cos(hd) })
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
  }
  ctx.lineWidth = 1.5; ctx.font = '10px ui-monospace'; ctx.textAlign = 'left'
  for (const a of W.airports) {
    if (a.type === 'small_airport' && range.value > 40) continue
    const [x, y] = P(a)
    if (y > cy + 5 || y < 0 || x < 0 || x > w) continue
    ctx.strokeStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#22d3ee'; ctx.fillText(a.ident, x + 7, y + 3)
  }
  // nav aids
  const tunedVor = W.nav.vor1?.valid ? W.nav.vor1.ident : null
  for (const s of W.stations) {
    if (s.type !== 'VOR' && s.type !== 'DVOR' && s.type !== 'NDB') continue
    const [x, y] = P(s)
    if (y > cy + 5 || y < 0 || x < 0 || x > w) continue
    ctx.strokeStyle = s.type === 'NDB' ? '#c084fc' : '#38bdf8'
    ctx.beginPath()
    if (s.type === 'NDB') ctx.arc(x, y, 5, 0, Math.PI * 2)
    else for (let i = 0; i <= 6; i++) { const t = (Math.PI / 3) * i; ctx[i ? 'lineTo' : 'moveTo'](x + 6 * Math.cos(t), y + 6 * Math.sin(t)) }
    ctx.stroke()
    ctx.fillStyle = ctx.strokeStyle; ctx.fillText(s.ident, x + 8, y + 3)
    if (s.ident === tunedVor && s.type !== 'NDB') {
      const c = deg2rad(W.radios.obsDeg)
      const [ex, ey] = P({ x: s.x + 200 * Math.sin(c), y: s.y + 200 * Math.cos(c) })
      const [fx, fy] = P({ x: s.x - 200 * Math.sin(c), y: s.y - 200 * Math.cos(c) })
      ctx.strokeStyle = '#e879f9'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([])
    }
  }
  // journey destination
  if (W.journey) {
    const d = toLocal({ lat: W.journey.to.runway.lat, lon: W.journey.to.runway.lon }, W.ref)
    const [x, y] = P(d)
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke()
  }
  // trail
  if (props.trail.length > 1) {
    ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 1.5; ctx.beginPath()
    props.trail.forEach((p, i) => { const [x, y] = P(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    ctx.stroke()
  }
  ctx.restore()
  // own aircraft + texts
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.moveTo(cx - 9, cy - 2); ctx.lineTo(cx + 9, cy - 2); ctx.stroke()
  ctx.fillStyle = '#e5e7eb'; ctx.font = '12px ui-monospace'; ctx.textAlign = 'left'
  ctx.fillText(`GS ${ac.gsKt.toFixed(0)}  TAS ${ac.tasKt.toFixed(0)}`, 6, 16)
  if (W.wind && W.wind.speedKt > 0) ctx.fillText(`${W.wind.fromDeg.toFixed(0).padStart(3, '0')}°/${W.wind.speedKt.toFixed(0)}`, 6, 32)
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillRect(cx - 24, 2, 48, 18); ctx.fillStyle = '#000'
  ctx.fillText(`${Math.round(((hdg % 360) + 360) % 360)}`.padStart(3, '0'), cx, 16)
})
watch(() => [props.world, props.trail, range.value], redraw)
</script>

<template>
  <div class="relative">
    <canvas ref="canvas" class="aspect-[4/3] w-full rounded border border-slate-700" />
    <div class="absolute bottom-1 right-1 flex gap-0.5 text-[10px]">
      <button v-for="r in RANGES" :key="r" class="rounded px-1" :class="r === range ? 'bg-sky-700' : 'bg-slate-800'" @click="range = r">{{ r }}</button>
    </div>
  </div>
</template>
