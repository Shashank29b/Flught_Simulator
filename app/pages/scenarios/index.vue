<script setup lang="ts">
import { computed } from 'vue'

interface Row { id: number; title: string; description: string; week: number }
const { data } = await useFetch<Row[]>('/api/scenarios', { default: () => [] })
const byWeek = computed(() => {
  const m = new Map<number, Row[]>()
  for (const s of data.value ?? []) m.set(s.week, [...(m.get(s.week) ?? []), s])
  return [...m.entries()]
})
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Test mode</h1>
      <p class="text-sm text-slate-400">Graded scenarios: your flight is recorded and scored. Every test starts parked on runway 09L at Bengaluru (VOBL) with speed and throttle at zero: take off, then fly the exercise. For free practice with every control, use the <NuxtLink to="/cockpit" class="text-sky-400">Cockpit</NuxtLink>.</p>
    </div>
    <div v-for="[week, rows] in byWeek" :key="week">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Level {{ week }}</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="s in rows" :key="s.id" class="flex flex-col rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h3 class="font-semibold">{{ s.title }}</h3>
          <p class="mt-1 flex-1 text-sm text-slate-400">{{ s.description }}</p>
          <NuxtLink :to="`/fly/${s.id}`" class="mt-3 self-start rounded bg-sky-600 px-3 py-1 text-sm font-semibold hover:bg-sky-500">Fly</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
