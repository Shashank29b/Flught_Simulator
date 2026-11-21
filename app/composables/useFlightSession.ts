import { ref } from 'vue'
import type { FlightResult } from '../../shared/types'

/** Talks to the flights API: start on load, end exactly once. */
export function useFlightSession() {
  const flightId = ref<string | null>(null)
  const ended = ref(false)
  const scoreTotal = ref<number | null>(null)
  const error = ref('')
  const beforeEnd: (() => Promise<void>)[] = []

  async function start(scenarioId: number): Promise<void> {
    flightId.value = null
    ended.value = false
    scoreTotal.value = null
    try {
      const r = await $fetch<{ id: string }>('/api/flights', { method: 'POST', body: { scenarioId } })
      flightId.value = r.id
    }
    catch {
      error.value = 'Could not start the flight session (are you logged in?)'
    }
  }

  async function end(result: FlightResult, landing?: { lateralM: number; vsFpm: number }): Promise<void> {
    if (!flightId.value || ended.value) return
    ended.value = true
    try {
      for (const fn of beforeEnd) await fn()
      const r = await $fetch<{ score: { total: number } }>(`/api/flights/${flightId.value}/end`, { method: 'PATCH', body: { result, landing } })
      scoreTotal.value = r.score.total
    }
    catch {
      error.value = 'Could not save the flight result'
    }
  }

  return { flightId, ended, scoreTotal, error, start, end, beforeEnd }
}
