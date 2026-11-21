<script setup lang="ts">
import { computed } from 'vue'
import type { AircraftState, Atmosphere } from '../../../shared/types'
import { atmosphereAt, densityAltitudeFt, pressureAltitudeFt, staticPressurePa } from '../../../shared/utils/isa'

const props = defineProps<{ ac: AircraftState; atmo: Atmosphere; baroHpa: number }>()
const emit = defineEmits<{ baro: [hpa: number] }>()
const a = computed(() => atmosphereAt(props.ac.altFt, props.atmo))
const pa = computed(() => pressureAltitudeFt(staticPressurePa(props.ac.altFt, props.atmo)))
const da = computed(() => densityAltitudeFt(props.ac.altFt, props.atmo))
const isStd = computed(() => Math.abs(props.baroHpa - 1013.25) < 0.01)
const set = (v: number) => emit('baro', Math.min(1050, Math.max(950, Math.round(v))))
</script>

<template>
  <div class="rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs">
    <div class="mb-1 flex justify-between text-slate-400">
      <span>AIR DATA (ISA)</span>
      <span>ISA{{ atmo.isaDevC >= 0 ? '+' : '' }}{{ atmo.isaDevC }} · QNH {{ atmo.qnhHpa.toFixed(0) }}</span>
    </div>
    <div class="grid grid-cols-3 gap-x-3 gap-y-0.5">
      <span>IAS {{ ac.iasKt.toFixed(0) }}</span>
      <span>TAS {{ ac.tasKt.toFixed(0) }}</span>
      <span>M {{ ac.mach.toFixed(3) }}</span>
      <span>OAT {{ a.oatC.toFixed(1) }}°C</span>
      <span>σ {{ a.sigma.toFixed(3) }}</span>
      <span>P {{ (a.pressurePa / 100).toFixed(1) }}</span>
      <span>PA {{ pa.toFixed(0) }}</span>
      <span>DA {{ da.toFixed(0) }}</span>
      <span>TRUE {{ ac.altFt.toFixed(0) }}</span>
    </div>
    <div class="mt-1 flex items-center gap-1">
      <span class="text-slate-400">BARO</span>
      <span :class="isStd ? 'text-cyan-300' : 'text-green-400'">{{ isStd ? 'STD' : baroHpa.toFixed(0) }}</span>
      <button class="rounded bg-slate-800 px-1.5" @click="set(baroHpa - 1)">−</button>
      <button class="rounded bg-slate-800 px-1.5" @click="set(baroHpa + 1)">+</button>
      <button class="rounded bg-slate-800 px-1.5" @click="emit('baro', 1013.25)">STD</button>
      <button class="rounded bg-slate-800 px-1.5" @click="emit('baro', atmo.qnhHpa)">QNH</button>
    </div>
  </div>
</template>
