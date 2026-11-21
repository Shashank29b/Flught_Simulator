import { onMounted, onUnmounted, type Ref } from 'vue'

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** Handles devicePixelRatio and resizing; call redraw() whenever data changes. */
export function useCanvas(canvas: Ref<HTMLCanvasElement | null>, draw: DrawFn) {
  let ro: ResizeObserver | null = null
  let w = 0
  let h = 0

  function resize(): void {
    const c = canvas.value
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    w = c.clientWidth
    h = c.clientHeight
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    redraw()
  }

  function redraw(): void {
    const c = canvas.value
    const ctx = c?.getContext('2d')
    if (!c || !ctx || !w || !h) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    draw(ctx, w, h)
  }

  onMounted(() => {
    ro = new ResizeObserver(resize)
    if (canvas.value) ro.observe(canvas.value)
    resize()
  })
  onUnmounted(() => ro?.disconnect())

  return { redraw }
}
