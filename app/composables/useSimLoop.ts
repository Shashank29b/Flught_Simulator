import { onMounted, onUnmounted } from 'vue'
import { useSimStore } from '../stores/sim'
import { advance } from '../sim/loop'

const STEP = 1 / 60

export function useSimLoop(onFrame?: () => void): void {
  const store = useSimStore()
  let raf = 0
  let last = 0
  let acc = 0

  function frame(t: number): void {
    const dt = last ? (t - last) / 1000 : 0
    last = t
    const r = advance(acc, dt, STEP)
    acc = r.acc
    for (let i = 0; i < r.steps; i++) store.tick(STEP)
    onFrame?.()
    raf = requestAnimationFrame(frame)
  }

  onMounted(() => {
    raf = requestAnimationFrame(frame)
  })
  onUnmounted(() => cancelAnimationFrame(raf))
}
