<script setup lang="ts">
import type { DmeOutput } from '#shared/types'

defineProps<{ dme: DmeOutput | undefined; gsKt: number }>()
</script>

<template>
  <div class="rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs">
    <div class="text-slate-400">DME</div>
    <div class="text-2xl text-red-400">{{ dme?.valid ? dme.distNm.toFixed(1) : '---' }}<span class="text-xs text-slate-500"> NM</span></div>
    <div class="text-slate-400">{{ dme?.valid ? `${gsKt.toFixed(0)} KT · ${gsKt > 20 ? Math.round((dme.distNm / gsKt) * 60) : '--'} MIN` : '' }}</div>
  </div>
</template>
