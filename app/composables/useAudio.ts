import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import type { MarkerOutput } from '../../shared/types'
import { callouts } from '../nav/radioAlt'

/** On/off patterns in 125 ms slots: OM dashes, MM dot-dash, IM dots. */
const PATTERNS = { om: { hz: 400, slots: [1, 1, 1, 0] }, mm: { hz: 1300, slots: [1, 0, 1, 1, 1, 0] }, im: { hz: 3000, slots: [1, 0] } } as const
const WORDS: Record<number, string> = { 1000: 'one thousand', 500: 'five hundred', 100: 'one hundred', 50: 'fifty' }

/**
 * Marker-beacon tones (Web Audio) and radio-altimeter callouts (speech). Off until the user enables sound
 * (browsers only allow audio after a user gesture). Callouts are also shown as text.
 */
export function useAudio(markers: Ref<MarkerOutput | undefined>, raFt: Ref<number | null | undefined>) {
  const enabled = ref(false)
  const callout = ref('')
  let ctx: AudioContext | null = null
  let osc: OscillatorNode | null = null
  let gain: GainNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let slot = 0
  let calloutTimer: ReturnType<typeof setTimeout> | null = null

  function ensureAudio(): void {
    if (ctx) return
    ctx = new AudioContext()
    osc = ctx.createOscillator()
    gain = ctx.createGain()
    gain.gain.value = 0
    osc.connect(gain).connect(ctx.destination)
    osc.start()
  }

  function tickTone(): void {
    if (!ctx || !osc || !gain) return
    const m = markers.value
    const active = m?.im ? PATTERNS.im : m?.mm ? PATTERNS.mm : m?.om ? PATTERNS.om : null
    slot++
    if (!enabled.value || !active) { gain.gain.setTargetAtTime(0, ctx.currentTime, 0.005); return }
    osc.frequency.setValueAtTime(active.hz, ctx.currentTime)
    gain.gain.setTargetAtTime(active.slots[slot % active.slots.length] ? 0.08 : 0, ctx.currentTime, 0.005)
  }

  function toggle(): void {
    enabled.value = !enabled.value
    if (enabled.value) {
      ensureAudio()
      void ctx?.resume()
    }
  }

  watch(raFt, (ra, prev) => {
    for (const c of callouts(prev ?? null, ra ?? null)) {
      callout.value = WORDS[c] ?? String(c)
      if (calloutTimer) clearTimeout(calloutTimer)
      calloutTimer = setTimeout(() => { callout.value = '' }, 2000)
      if (enabled.value && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(WORDS[c] ?? String(c)))
      }
    }
  })

  onMounted(() => { timer = setInterval(tickTone, 125) })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
    if (calloutTimer) clearTimeout(calloutTimer)
    void ctx?.close()
  })

  return { enabled, callout, toggle }
}
