import { watch, type Ref } from 'vue'
import { REF, toLatLon, toLocal } from '#shared/utils/geo'
import type { FlightSampleInput } from '#shared/types'
import type { World } from '../sim/engine'

const PERIOD_MS = 200 // 5 Hz of simulated time
const BATCH = 25

/** Builds one recorder sample. Positions are stored in the fixed VOBL frame so replays line up across re-centring. */
export function makeSample(w: World): FlightSampleInput {
  const p = toLocal(toLatLon(w.ac, w.ref), REF)
  const n = w.nav
  const nav: FlightSampleInput['nav'] = {}
  if (n.vor1?.valid) nav.cdiDevDeg = n.vor1.cdiDevDeg
  if (n.ils?.locValid) { nav.locDevDeg = n.ils.locDevDeg; nav.locFrac = n.ils.locFrac }
  if (n.ils?.gsValid) nav.gsDevDeg = n.ils.gsDevDeg
  if (n.dme1?.valid) nav.dmeNm = n.dme1.distNm
  return { tMs: Math.round(w.simMs), x: p.x, y: p.y, altFt: w.ac.altFt, hdgDeg: w.ac.hdgDeg, iasKt: w.ac.iasKt, vsFpm: w.ac.vsFpm, nav }
}

/** Records the flight while a Test-mode session is open; flush() must run before the flight is ended. */
export function useRecorder(world: Ref<World>, flightId: Ref<string | null>, ended: Ref<boolean>) {
  let buffer: FlightSampleInput[] = []
  let nextMs = 0
  let sending: Promise<void> = Promise.resolve()

  async function post(id: string, batch: FlightSampleInput[]): Promise<void> {
    for (let i = 0; i < batch.length; i += 100) {
      await $fetch(`/api/flights/${id}/samples`, { method: 'POST', body: { samples: batch.slice(i, i + 100) } })
    }
  }

  function send(): Promise<void> {
    const id = flightId.value
    if (!id || !buffer.length) return sending
    const batch = buffer
    buffer = []
    sending = sending.then(() => post(id, batch)).catch(() => { /* a lost batch only lowers the replay detail */ })
    return sending
  }

  watch(flightId, () => { buffer = []; nextMs = 0 })
  watch(world, (w) => {
    if (!flightId.value || ended.value || w.done) return
    if (w.simMs < nextMs) return
    nextMs = w.simMs + PERIOD_MS
    buffer.push(makeSample(w))
    if (buffer.length >= BATCH) void send()
  })

  return { flush: send }
}
