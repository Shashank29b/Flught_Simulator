import { onMounted, onUnmounted } from 'vue'
import { useSimStore } from '../stores/sim'

const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '])

export function useKeyboard(): void {
  const store = useSimStore()

  function isTyping(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')
  }

  function down(e: KeyboardEvent): void {
    if (isTyping(e)) return
    if (PREVENT.has(e.key)) e.preventDefault()
    if (e.repeat) return
    const k = e.key.toLowerCase()
    if (k === 'g') store.toggleGear()
    else if (k === 'f') store.cycleFlaps()
    else if (k === 'p') store.paused = !store.paused
    else if (k === 'r') store.reset()
    else store.keys.add(e.key)
  }

  function up(e: KeyboardEvent): void {
    store.keys.delete(e.key)
  }

  function blur(): void {
    store.keys.clear()
  }

  onMounted(() => {
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', blur)
    store.keys.clear()
  })
}
