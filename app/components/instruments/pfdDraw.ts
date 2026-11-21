/** Pure helpers + canvas drawing for the PFD. Each draw function stays small. */

/** Tick values within value ± halfRange on a step grid, ascending. */
export function tapeTicks(value: number, step: number, halfRange: number): number[] {
  const out: number[] = []
  for (let v = Math.ceil((value - halfRange) / step) * step; v <= value + halfRange + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000)
  return out
}

export interface Box { x: number; y: number; w: number; h: number }
const MONO = (px: number) => `${Math.round(px)}px ui-monospace, monospace`

export function drawAttitude(ctx: CanvasRenderingContext2D, b: Box, pitchDeg: number, bankDeg: number): void {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const ppd = b.h / 40 // 40° visible
  ctx.save()
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip()
  ctx.translate(cx, cy)
  ctx.rotate((-bankDeg * Math.PI) / 180)
  const off = pitchDeg * ppd
  ctx.fillStyle = '#1d6fb8'; ctx.fillRect(-b.w * 2, -b.h * 3 + off, b.w * 4, b.h * 3)
  ctx.fillStyle = '#7a4a1e'; ctx.fillRect(-b.w * 2, off, b.w * 4, b.h * 3)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(-b.w * 2, off); ctx.lineTo(b.w * 2, off); ctx.stroke()
  ctx.lineWidth = 1.2; ctx.fillStyle = '#fff'; ctx.font = MONO(b.h * 0.035); ctx.textAlign = 'left'
  for (let p = -30; p <= 30; p += 2.5) {
    if (p === 0) continue
    const y = off - p * ppd
    const half = p % 10 === 0 ? b.w * 0.18 : p % 5 === 0 ? b.w * 0.1 : b.w * 0.05
    ctx.beginPath(); ctx.moveTo(-half, y); ctx.lineTo(half, y); ctx.stroke()
    if (p % 10 === 0) ctx.fillText(String(Math.abs(p)), half + 4, y + 4)
  }
  ctx.restore()
  // bank pointer + aircraft symbol
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
  const r = b.h * 0.42
  for (const a of [-45, -30, -20, -10, 0, 10, 20, 30, 45]) {
    const t = ((a - 90) * Math.PI) / 180
    const l = a % 30 === 0 ? 10 : 6
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r); ctx.lineTo(cx + Math.cos(t) * (r - l), cy + Math.sin(t) * (r - l)); ctx.stroke()
  }
  const t = ((-bankDeg - 90) * Math.PI) / 180
  ctx.fillStyle = '#facc15'
  ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (r - 2), cy + Math.sin(t) * (r - 2)); ctx.lineTo(cx + Math.cos(t + 0.05) * (r - 14), cy + Math.sin(t + 0.05) * (r - 14)); ctx.lineTo(cx + Math.cos(t - 0.05) * (r - 14), cy + Math.sin(t - 0.05) * (r - 14)); ctx.fill()
  ctx.strokeStyle = '#000'; ctx.fillStyle = '#facc15'; ctx.lineWidth = 1
  for (const s of [-1, 1]) { ctx.fillRect(cx + s * b.w * 0.12 - (s < 0 ? b.w * 0.14 : 0), cy - 3, b.w * 0.14, 6); ctx.strokeRect(cx + s * b.w * 0.12 - (s < 0 ? b.w * 0.14 : 0), cy - 3, b.w * 0.14, 6) }
  ctx.fillRect(cx - 4, cy - 4, 8, 8)
}

export function drawTape(ctx: CanvasRenderingContext2D, b: Box, value: number, opt: { step: number; label: number; pxPer: number; decimals?: number; bug?: number | null; redBelow?: number; side: 'left' | 'right' }): void {
  ctx.fillStyle = '#1f2937cc'; ctx.fillRect(b.x, b.y, b.w, b.h)
  const cy = b.y + b.h / 2
  const half = b.h / 2 / opt.pxPer
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip()
  if (opt.redBelow !== undefined) {
    const yTop = cy - (opt.redBelow - value) * opt.pxPer
    ctx.fillStyle = '#dc2626'; ctx.fillRect(opt.side === 'left' ? b.x + b.w - 6 : b.x, yTop, 6, b.y + b.h - yTop)
  }
  ctx.strokeStyle = '#e5e7eb'; ctx.fillStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.font = MONO(b.w * 0.2)
  ctx.textAlign = opt.side === 'left' ? 'right' : 'left'
  for (const v of tapeTicks(value, opt.step, half)) {
    if (v < 0 && opt.side === 'left') continue
    const y = cy - (v - value) * opt.pxPer
    const x0 = opt.side === 'left' ? b.x + b.w : b.x
    const len = v % opt.label === 0 ? 10 : 5
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (opt.side === 'left' ? -len : len), y); ctx.stroke()
    if (v % opt.label === 0) ctx.fillText(String(v), opt.side === 'left' ? b.x + b.w - 13 : b.x + 13, y + 4)
  }
  if (opt.bug !== null && opt.bug !== undefined) {
    const y = cy - (opt.bug - value) * opt.pxPer
    ctx.fillStyle = '#e879f9'
    const x0 = opt.side === 'left' ? b.x + b.w : b.x
    const d = opt.side === 'left' ? -1 : 1
    ctx.beginPath(); ctx.moveTo(x0, y - 6); ctx.lineTo(x0 + d * 8, y - 6); ctx.lineTo(x0 + d * 8, y + 6); ctx.lineTo(x0, y + 6); ctx.lineTo(x0 + d * 4, y); ctx.fill()
  }
  ctx.restore()
  // readout box
  ctx.fillStyle = '#000'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5
  ctx.fillRect(b.x + 2, cy - 12, b.w - 4, 24); ctx.strokeRect(b.x + 2, cy - 12, b.w - 4, 24)
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = MONO(b.w * 0.24)
  ctx.fillText(value.toFixed(opt.decimals ?? 0), b.x + b.w / 2, cy + 6)
}

export function drawHeadingTape(ctx: CanvasRenderingContext2D, b: Box, hdg: number, bug: number | null): void {
  ctx.fillStyle = '#1f2937cc'; ctx.fillRect(b.x, b.y, b.w, b.h)
  const cx = b.x + b.w / 2
  const ppd = b.w / 60
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip()
  ctx.strokeStyle = '#e5e7eb'; ctx.fillStyle = '#e5e7eb'; ctx.font = MONO(b.h * 0.4); ctx.textAlign = 'center'
  for (const v of tapeTicks(hdg, 5, 32)) {
    const x = cx + (v - hdg) * ppd
    const n = ((Math.round(v) % 360) + 360) % 360
    ctx.beginPath(); ctx.moveTo(x, b.y); ctx.lineTo(x, b.y + (n % 10 === 0 ? 8 : 4)); ctx.stroke()
    if (n % 10 === 0) ctx.fillText(String(n / 10).padStart(2, '0'), x, b.y + b.h - 4)
  }
  if (bug !== null) {
    let d = ((bug - hdg + 540) % 360) - 180
    d = Math.max(-30, Math.min(30, d))
    ctx.fillStyle = '#e879f9'; ctx.fillRect(cx + d * ppd - 5, b.y, 10, 5)
  }
  ctx.restore()
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(cx, b.y + 10); ctx.lineTo(cx - 6, b.y); ctx.lineTo(cx + 6, b.y); ctx.fill()
}

export function drawVsi(ctx: CanvasRenderingContext2D, b: Box, vs: number): void {
  ctx.fillStyle = '#1f2937cc'; ctx.fillRect(b.x, b.y, b.w, b.h)
  const cy = b.y + b.h / 2
  const scale = (v: number) => Math.sign(v) * Math.min(1, Math.sqrt(Math.abs(v) / 6000)) * (b.h / 2 - 8)
  ctx.strokeStyle = '#94a3b8'; ctx.fillStyle = '#94a3b8'; ctx.font = MONO(9); ctx.textAlign = 'left'
  for (const v of [-6000, -2000, -1000, 0, 1000, 2000, 6000]) {
    const y = cy - scale(v)
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + 5, y); ctx.stroke()
    if (v !== 0) ctx.fillText(String(Math.abs(v) / 1000), b.x + 7, y + 3)
  }
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(b.x + b.w, cy); ctx.lineTo(b.x + 2, cy - scale(vs)); ctx.stroke()
  ctx.fillStyle = '#22c55e'; ctx.font = MONO(10)
  if (Math.abs(vs) > 400) ctx.fillText(String(Math.round(vs / 100) * 100), b.x, vs > 0 ? b.y + 10 : b.y + b.h - 2)
}

/** ILS deviation diamond on a 2-dot scale; frac positive = diamond right/up. */
export function drawDiamondScale(ctx: CanvasRenderingContext2D, cx: number, cy: number, horizontal: boolean, spacing: number, frac: number | null): void {
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.2
  for (const i of [-2, -1, 1, 2]) {
    ctx.beginPath(); ctx.arc(cx + (horizontal ? i * spacing : 0), cy - (horizontal ? 0 : i * spacing), 3, 0, Math.PI * 2); ctx.stroke()
  }
  if (frac === null) return
  const o = Math.max(-1, Math.min(1, frac)) * 2 * spacing
  const x = cx + (horizontal ? o : 0)
  const y = cy - (horizontal ? 0 : o)
  ctx.fillStyle = '#e879f9'
  ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 6, y); ctx.fill()
}
