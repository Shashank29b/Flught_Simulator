/** Shared canvas helpers for round instruments. Angles: degrees clockwise from 12 o'clock. */
export interface Dial { ctx: CanvasRenderingContext2D; cx: number; cy: number; r: number }

export function dial(ctx: CanvasRenderingContext2D, w: number, h: number): Dial {
  const r = Math.min(w, h) / 2 - 4
  const cx = w / 2
  const cy = h / 2
  ctx.fillStyle = '#111827'
  ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#030712'
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  return { ctx, cx, cy, r }
}

const rad = (clockDeg: number) => ((clockDeg - 90) * Math.PI) / 180

export function tick(d: Dial, deg: number, len: number, width = 1.5, color = '#e5e7eb'): void {
  const a = rad(deg)
  d.ctx.strokeStyle = color
  d.ctx.lineWidth = width
  d.ctx.beginPath()
  d.ctx.moveTo(d.cx + Math.cos(a) * d.r * 0.95, d.cy + Math.sin(a) * d.r * 0.95)
  d.ctx.lineTo(d.cx + Math.cos(a) * d.r * (0.95 - len), d.cy + Math.sin(a) * d.r * (0.95 - len))
  d.ctx.stroke()
}

export function label(d: Dial, deg: number, text: string, at = 0.7, size = 0.13): void {
  const a = rad(deg)
  d.ctx.fillStyle = '#e5e7eb'
  d.ctx.font = `${Math.round(d.r * size)}px ui-monospace, monospace`
  d.ctx.textAlign = 'center'
  d.ctx.textBaseline = 'middle'
  d.ctx.fillText(text, d.cx + Math.cos(a) * d.r * at, d.cy + Math.sin(a) * d.r * at)
}

export function needle(d: Dial, deg: number, len: number, width: number, color = '#f8fafc'): void {
  const a = rad(deg)
  d.ctx.strokeStyle = color
  d.ctx.lineWidth = width
  d.ctx.lineCap = 'round'
  d.ctx.beginPath()
  d.ctx.moveTo(d.cx, d.cy)
  d.ctx.lineTo(d.cx + Math.cos(a) * d.r * len, d.cy + Math.sin(a) * d.r * len)
  d.ctx.stroke()
  d.ctx.fillStyle = '#9ca3af'
  d.ctx.beginPath(); d.ctx.arc(d.cx, d.cy, d.r * 0.06, 0, Math.PI * 2); d.ctx.fill()
}

export function title(d: Dial, text: string, dy = 0.35): void {
  d.ctx.fillStyle = '#9ca3af'
  d.ctx.font = `${Math.round(d.r * 0.11)}px ui-sans-serif, sans-serif`
  d.ctx.textAlign = 'center'
  d.ctx.fillText(text, d.cx, d.cy + d.r * dy)
}
