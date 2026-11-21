<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { World } from '../../sim/engine'
import { stallKt } from '../../sim/aircraft'
import { fma } from '../../systems/autopilot'
import { indicatedAltitudeFt } from '../../../shared/utils/isa'
import { useCanvas } from '../../composables/useCanvas'
import { drawAttitude, drawDiamondScale, drawHeadingTape, drawTape, drawVsi } from './pfdDraw'

const props = defineProps<{ world: World }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const modes = computed(() => (props.world.ap?.engaged ? fma(props.world.ap) : null))

const { redraw } = useCanvas(canvas, (ctx, w, h) => {
  const W = props.world
  const ac = W.ac
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
  const top = 22
  const att = { x: w * 0.2, y: top + 6, w: w * 0.58, h: h - top - 46 }
  drawAttitude(ctx, att, ac.pitchDeg, ac.bankDeg)
  const ap = W.ap?.engaged ? W.ap : null
  drawTape(ctx, { x: 2, y: att.y, w: w * 0.17, h: att.h }, ac.iasKt, { step: 10, label: 20, pxPer: att.h / 120, bug: ap?.athr ? ap.spdKt : null, redBelow: stallKt(W.profile, ac.flapsDeg), side: 'left' })
  const alt = indicatedAltitudeFt(ac.altFt, W.radios.baroHpa, W.atmo)
  drawTape(ctx, { x: att.x + att.w + 3, y: att.y, w: w * 0.15, h: att.h }, Math.round(alt), { step: 100, label: 500, pxPer: att.h / 1200, bug: ap ? ap.altFt : null, side: 'right' })
  drawVsi(ctx, { x: w - w * 0.045 - 1, y: att.y + att.h * 0.1, w: w * 0.045, h: att.h * 0.8 }, ac.vsFpm)
  drawHeadingTape(ctx, { x: att.x, y: att.y + att.h + 4, w: att.w, h: 30 }, ac.hdgDeg, ap ? ap.hdgDeg : null)
  // ILS diamonds
  const ils = W.nav.ils
  if (ils?.locValid) drawDiamondScale(ctx, att.x + att.w / 2, att.y + att.h - 14, true, att.w * 0.07, ils.locFrac)
  if (ils?.locValid) drawDiamondScale(ctx, att.x + att.w - 14, att.y + att.h / 2, false, att.h * 0.07, ils.gsValid ? ils.gsFrac : null)
  // radio altitude, baro, FMA
  ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center'
  if (W.nav.raFt !== null && W.nav.raFt !== undefined) {
    ctx.fillStyle = W.nav.raFt < 500 ? '#fbbf24' : '#e5e7eb'
    ctx.fillText(`RA ${Math.round(W.nav.raFt)}`, att.x + att.w / 2, att.y + att.h - 32)
  }
  ctx.fillStyle = '#22d3ee'; ctx.textAlign = 'left'
  ctx.fillText(Math.abs(W.radios.baroHpa - 1013.25) < 0.01 ? 'STD' : `QNH ${W.radios.baroHpa.toFixed(0)}`, att.x + att.w + 6, att.y + att.h + 22)
  ctx.fillStyle = '#e5e7eb'
  ctx.fillText(`M ${ac.mach.toFixed(2)}  GS ${ac.gsKt.toFixed(0)}`, 4, att.y + att.h + 22)
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w, top)
  ctx.textAlign = 'center'; ctx.font = '12px ui-monospace, monospace'
  const m = modes.value
  const cells = m ? [m.thrust, m.lateral, m.vertical, m.armed ? `arm ${m.armed}` : 'AP1'] : ['MAN THR', 'AP OFF', '', '']
  cells.forEach((c, i) => { ctx.fillStyle = i === 3 ? '#22d3ee' : m ? '#4ade80' : '#94a3b8'; ctx.fillText(c, (w / 4) * (i + 0.5), 15) })
})
watch(() => props.world, redraw)
</script>

<template><canvas ref="canvas" class="aspect-[4/3] w-full rounded border border-slate-700" /></template>
