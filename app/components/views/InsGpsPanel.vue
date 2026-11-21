<script setup lang="ts">
import { computed } from 'vue'
import { useSimStore } from '../../stores/sim'

const store = useSimStore()
const g = computed(() => store.world.insgps)
const insErr = computed(() => Math.hypot(g.value.ins.errX, g.value.ins.errY))
const gpsErr = computed(() => (g.value.gps ? Math.hypot(g.value.gps[0], g.value.gps[1]) : null))
const blendErr = computed(() => Math.hypot(g.value.ins.errX - g.value.est[0], g.value.ins.errY - g.value.est[1]))
const fmt = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(0)} m`)
</script>

<template>
  <div class="rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs">
    <div class="mb-1 flex items-center justify-between text-slate-400">
      <span>INS / GPS (error from true position)</span>
      <span :class="g.outage ? 'text-red-400' : 'text-green-400'">{{ g.outage ? 'GPS 0 SATS' : 'GPS 9 SATS' }}</span>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <div><div class="text-[10px] text-orange-300">INS (drifts)</div><div class="text-lg text-orange-300">{{ fmt(insErr) }}</div></div>
      <div><div class="text-[10px] text-sky-300">GPS fix</div><div class="text-lg text-sky-300">{{ gpsErr === null ? '---' : fmt(gpsErr) }}</div></div>
      <div><div class="text-[10px] text-green-300">INS+GPS blended</div><div class="text-lg text-green-300">{{ fmt(blendErr) }}</div></div>
    </div>
    <div class="mt-1 flex gap-1">
      <button class="rounded px-2 py-0.5" :class="g.outage ? 'bg-red-800' : 'bg-slate-800'" @click="store.setGpsOutage(!g.outage)">{{ g.outage ? 'Restore GPS' : 'Simulate GPS outage' }}</button>
      <button class="rounded bg-slate-800 px-2 py-0.5" @click="store.realignIns()">Re-align INS</button>
    </div>
  </div>
</template>
