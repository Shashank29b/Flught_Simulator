<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { bearingDeg } from '../../../shared/utils/geo'
import { wrap180 } from '../../../shared/utils/units'
import type { World } from '../../sim/engine'
import { useCanvas } from '../../composables/useCanvas'

const props = defineProps<{ world: World }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const station = computed(() => props.world.stations.find(s => (s.type === 'VOR' || s.type === 'DVOR') && Math.abs(s.frequency - props.world.radios.nav1MHz) < 0.001))
const siteError = computed(() => {
  const st = station.value
  const v = props.world.nav.vor1
  if (!st || !v?.valid) return null
  return wrap180(v.radialDeg - bearingDeg(st, props.world.ac))
})

/** Teaching animation, slowed down: real rotation is 30 rev/s. */
const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const st = station.value
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) / 2 - 10
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)
  if (!st) {
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Tune a VOR or DVOR', cx, cy)
    return
  }
  const phase = ((props.world.simMs / 1000) * 0.5 * 360) % 360
  const rad = (d: number) => ((d - 90) * Math.PI) / 180
  if (st.type === 'DVOR') {
    for (let i = 0; i < 48; i++) {
      const a = i * 7.5
      const lit = Math.abs(wrap180(a - phase)) < 4
      ctx.fillStyle = lit ? '#facc15' : '#334155'
      ctx.beginPath(); ctx.arc(cx + Math.cos(rad(a)) * r * 0.8, cy + Math.sin(rad(a)) * r * 0.8, lit ? 4 : 2.5, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()
  }
  else {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad(phase) + Math.PI / 2)
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2
    for (const s of [1, -1]) {
      ctx.beginPath(); ctx.ellipse(0, s * r * 0.35, r * 0.28, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }
  const brg = bearingDeg(st, props.world.ac)
  ctx.strokeStyle = '#a3e635'; ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(rad(brg)) * r, cy + Math.sin(rad(brg)) * r); ctx.stroke()
  ctx.setLineDash([])
})
watch(() => props.world, redraw)
</script>

<template>
  <div class="rounded border border-slate-700 bg-slate-900 p-2 text-xs">
    <div class="mb-1 flex justify-between text-slate-400">
      <span>{{ station ? `${station.type === 'DVOR' ? 'Doppler VOR' : 'Conventional VOR'} · ${station.ident}` : 'VOR' }}</span>
      <span v-if="siteError !== null" class="font-mono">site error {{ siteError.toFixed(2) }}°</span>
    </div>
    <canvas ref="canvas" class="aspect-square w-full" />
    <p class="mt-1 text-[11px] leading-snug text-slate-500">
      {{ station?.type === 'DVOR'
        ? '48-antenna ring: the lit antenna rotates, giving a Doppler-shifted variable phase; reflections cause little site error.'
        : 'Rotating cardioid/figure-8 pattern: the variable phase vs the 30 Hz reference gives the radial; site error is larger.' }}
    </p>
  </div>
</template>
