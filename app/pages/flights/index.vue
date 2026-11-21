<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Row { id: string; scenarioTitle: string; userName: string; startedAt: string; endedAt: string | null; result: string; score: number | null }
const { user } = useUserSession()
const all = ref(false)
const { data } = await useFetch<Row[]>('/api/flights', { query: computed(() => (all.value ? { all: '1' } : {})), default: () => [] })
const color = (r: string) => ({ LANDED: 'text-green-400', COMPLETED: 'text-green-400', CRASHED: 'text-red-400', ABORTED: 'text-slate-400' } as Record<string, string>)[r] ?? 'text-amber-300'
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center gap-4">
      <h1 class="text-2xl font-bold">Flight log</h1>
      <label v-if="user?.role === 'ADMIN'" class="text-sm text-slate-400"><input v-model="all" type="checkbox"> all students</label>
    </div>
    <table class="w-full text-left text-sm">
      <thead class="text-slate-400"><tr><th class="py-2">Date</th><th v-if="all">Student</th><th>Scenario</th><th>Result</th><th>Score</th><th /></tr></thead>
      <tbody>
        <tr v-for="f in data" :key="f.id" class="border-t border-slate-800">
          <td class="py-2">{{ new Date(f.startedAt).toLocaleString() }}</td>
          <td v-if="all">{{ f.userName }}</td>
          <td>{{ f.scenarioTitle }}</td>
          <td :class="color(f.result)">{{ f.result }}</td>
          <td>{{ f.score ?? '–' }}</td>
          <td><NuxtLink :to="`/flights/${f.id}`" class="text-sky-400">Replay</NuxtLink></td>
        </tr>
        <tr v-if="!data?.length"><td colspan="6" class="py-6 text-center text-slate-500">No flights yet.</td></tr>
      </tbody>
    </table>
  </section>
</template>
