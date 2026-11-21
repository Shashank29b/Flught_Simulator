<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../../composables/useCanvas'

const props = defineProps<{ title: string; unit: string; t: number[]; values: (number | null)[]; cursor: number; zeroLine?: boolean; range?: [number, number] }>()
const canvas = ref<HTMLCanvasElement | null>(null)

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, w, h)
  const vals = props.values.filter((v): v is number => v !== null)
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-sans-serif'
  ctx.fillText(`${props.title} (${props.unit})`, 6, 13)
  if (vals.length < 2 || props.t.length < 2) { ctx.fillText('no data', w / 2 - 20, h / 2); return }
  let [lo, hi] = props.range ?? [Math.min(...vals), Math.max(...vals)]
  if (hi - lo < 1e-6) { lo -= 1; hi += 1 }
  const pad = { l: 44, r: 8, t: 18, b: 16 }
  const t0 = props.t[0]!
  const t1 = props.t[props.t.length - 1]!
  const X = (t: number) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r)
  const Y = (v: number) => pad.t + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (h - pad.t - pad.b)
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1
  for (const v of [lo, (lo + hi) / 2, hi]) {
    ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke()
    ctx.fillStyle = '#64748b'; ctx.fillText(v.toFixed(Math.abs(hi - lo) < 10 ? 1 : 0), 2, Y(v) + 4)
  }
  if (props.zeroLine && lo < 0 && hi > 0) {
    ctx.strokeStyle = '#475569'; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(w - pad.r, Y(0)); ctx.stroke(); ctx.setLineDash([])
  }
  ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5
  ctx.beginPath()
  let pen = false
  props.values.forEach((v, i) => {
    if (v === null) { pen = false; return }
    const x = X(props.t[i]!)
    const y = Y(v)
    if (pen) ctx.lineTo(x, y)
    else { ctx.moveTo(x, y); pen = true }
  })
  ctx.stroke()
  const ci = Math.min(props.t.length - 1, Math.max(0, props.cursor))
  ctx.strokeStyle = '#facc15'
  ctx.beginPath(); ctx.moveTo(X(props.t[ci]!), pad.t); ctx.lineTo(X(props.t[ci]!), h - pad.b); ctx.stroke()
  const cv = props.values[ci]
  ctx.fillStyle = '#facc15'
  ctx.fillText(cv === null || cv === undefined ? '—' : cv.toFixed(1), Math.min(w - 50, X(props.t[ci]!) + 4), pad.t + 10)
})
watch(() => [props.values, props.cursor], redraw)
</script>

<template><canvas ref="canvas" class="h-36 w-full rounded border border-slate-800" /></template>
