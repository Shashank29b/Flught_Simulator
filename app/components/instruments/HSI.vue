<script setup lang="ts">
import { ref, watch } from 'vue'
import { wrap360 } from '#shared/utils/units'
import { useCanvas } from '../../composables/useCanvas'
import { dial, label, tick } from './dial'
import { hsiBarOffsetPx, type HsiInput } from './hsiMath'

const props = defineProps<{ hdgDeg: number; hsi: HsiInput }>()
const emit = defineEmits<{ obs: [deg: number] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const rad = (d: number) => (d * Math.PI) / 180

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const d = dial(ctx, w, h)
  const rot = -props.hdgDeg
  const NAMES: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }
  for (let a = 0; a < 360; a += 5) tick(d, a + rot, a % 10 === 0 ? 0.1 : 0.05)
  for (let a = 0; a < 360; a += 30) label(d, a + rot, NAMES[a] ?? String(a / 10), 0.76, 0.12)
  // lubber line
  ctx.fillStyle = '#f97316'
  ctx.beginPath(); ctx.moveTo(d.cx, d.cy - d.r * 0.99); ctx.lineTo(d.cx - 6, d.cy - d.r * 0.87); ctx.lineTo(d.cx + 6, d.cy - d.r * 0.87); ctx.fill()

  const s = props.hsi
  const color = s.mode === 'LOC' ? '#4ade80' : '#e879f9'
  const dot = d.r * 0.14
  ctx.save()
  ctx.translate(d.cx, d.cy)
  ctx.rotate(rad(s.courseDeg - props.hdgDeg))
  // deviation dots
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5
  for (const i of [-2, -1, 1, 2]) { ctx.beginPath(); ctx.arc(i * dot, 0, 3, 0, Math.PI * 2); ctx.stroke() }
  // course arrow (head and tail)
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(0, -d.r * 0.68); ctx.lineTo(0, -d.r * 0.38); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -d.r * 0.78); ctx.lineTo(-8, -d.r * 0.64); ctx.lineTo(8, -d.r * 0.64); ctx.fill()
  ctx.beginPath(); ctx.moveTo(0, d.r * 0.38); ctx.lineTo(0, d.r * 0.68); ctx.stroke()
  // deviation bar
  const bx = s.navValid ? hsiBarOffsetPx(s.devFrac, dot) : 0
  ctx.strokeStyle = s.navValid ? color : '#64748b'
  ctx.beginPath(); ctx.moveTo(bx, -d.r * 0.34); ctx.lineTo(bx, d.r * 0.34); ctx.stroke()
  // TO / FROM triangle
  if (s.navValid && s.toFrom !== 'OFF') {
    const y = s.toFrom === 'TO' ? -d.r * 0.22 : d.r * 0.22
    const dir = s.toFrom === 'TO' ? -1 : 1
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath(); ctx.moveTo(d.r * 0.2, y + dir * 8); ctx.lineTo(d.r * 0.2 - 7, y - dir * 4); ctx.lineTo(d.r * 0.2 + 7, y - dir * 4); ctx.fill()
  }
  ctx.restore()

  // aircraft symbol
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(d.cx, d.cy - 12); ctx.lineTo(d.cx, d.cy + 12)
  ctx.moveTo(d.cx - 12, d.cy - 2); ctx.lineTo(d.cx + 12, d.cy - 2)
  ctx.moveTo(d.cx - 5, d.cy + 10); ctx.lineTo(d.cx + 5, d.cy + 10)
  ctx.stroke()

  // glide-slope scale (right) in LOC mode
  if (s.mode === 'LOC') {
    const gx = d.cx + d.r * 0.88
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5
    for (const i of [-2, -1, 1, 2]) { ctx.beginPath(); ctx.arc(gx, d.cy + i * dot * 0.8, 2.5, 0, Math.PI * 2); ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(gx - 6, d.cy); ctx.lineTo(gx + 6, d.cy); ctx.stroke()
    if (s.gsValid) {
      const gy = d.cy - Math.max(-1, Math.min(1, s.gsFrac)) * 2 * dot * 0.8
      ctx.fillStyle = '#4ade80'
      ctx.beginPath(); ctx.moveTo(gx, gy - 7); ctx.lineTo(gx + 6, gy); ctx.lineTo(gx, gy + 7); ctx.lineTo(gx - 6, gy); ctx.fill()
    }
  }

  // flags and text
  ctx.font = `bold ${Math.round(d.r * 0.11)}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  const flag = (text: string, x: number, y: number) => {
    ctx.fillStyle = '#dc2626'; ctx.fillRect(x - d.r * 0.16, y - d.r * 0.08, d.r * 0.32, d.r * 0.15)
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y + d.r * 0.035)
  }
  if (!s.navValid) flag('NAV', d.cx - d.r * 0.42, d.cy - d.r * 0.42)
  if (s.mode === 'LOC' && !s.gsValid) flag('GS', d.cx + d.r * 0.55, d.cy - d.r * 0.42)
  ctx.fillStyle = color
  ctx.fillText(`${s.mode} ${s.ident || '---'}`, d.cx, d.cy + d.r * 0.5)
  ctx.fillStyle = '#e5e7eb'
  ctx.fillText(`CRS ${String(Math.round(wrap360(s.courseDeg))).padStart(3, '0')}`, d.cx, d.cy + d.r * 0.66)
})
watch(() => [props.hdgDeg, props.hsi], redraw, { deep: true })

function turn(e: MouseEvent, dir: number): void {
  emit('obs', wrap360(props.hsi.courseDeg + dir * (e.shiftKey ? 10 : 1)))
}
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <canvas ref="canvas" class="aspect-square w-full" />
    <div class="flex gap-1 text-xs">
      <button class="rounded bg-slate-800 px-2 disabled:opacity-40" :disabled="hsi.mode === 'LOC'" title="Course −1 (shift −10)" @click="turn($event, -1)">◀ CRS</button>
      <button class="rounded bg-slate-800 px-2 disabled:opacity-40" :disabled="hsi.mode === 'LOC'" title="Course +1 (shift +10)" @click="turn($event, 1)">CRS ▶</button>
    </div>
  </div>
</template>
