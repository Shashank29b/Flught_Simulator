import type { NavStation, RunwayInfo } from '#shared/types'
import { NM_TO_M, deg2rad } from '#shared/utils/units'

export type Project = (x: number, y: number) => [number, number]

const COLORS: Record<string, string> = {
  VOR: '#38bdf8', DVOR: '#38bdf8', DME: '#38bdf8', NDB: '#c084fc',
  ILS_LOC: '#4ade80', ILS_GS: '#4ade80', MARKER_OM: '#60a5fa', MARKER_MM: '#fbbf24', MARKER_IM: '#e5e7eb',
}

export function drawStation(ctx: CanvasRenderingContext2D, s: NavStation, p: Project): void {
  const [sx, sy] = p(s.x, s.y)
  ctx.strokeStyle = COLORS[s.type] ?? '#fff'
  ctx.fillStyle = ctx.strokeStyle
  ctx.lineWidth = 1.5
  ctx.beginPath()
  if (s.type === 'VOR' || s.type === 'DVOR') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i
      const fn = i === 0 ? 'moveTo' : 'lineTo'
      ctx[fn](sx + 8 * Math.cos(a), sy + 8 * Math.sin(a))
    }
    ctx.closePath()
    ctx.stroke()
    if (s.type === 'DVOR') {
      ctx.beginPath()
      ctx.arc(sx, sy, 12, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  else if (s.type === 'DME') {
    return
  }
  else if (s.type === 'NDB') {
    ctx.setLineDash([2, 3])
    ctx.arc(sx, sy, 9, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
  else if (s.type.startsWith('MARKER')) {
    ctx.ellipse(sx, sy, 3, 7, 0, 0, Math.PI * 2)
    ctx.stroke()
    return
  }
  else if (s.type === 'ILS_GS') {
    return
  }
  else {
    ctx.arc(sx, sy, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`${s.ident} ${s.type === 'NDB' ? s.frequency.toFixed(0) : s.frequency.toFixed(2)}`, sx + 12, sy - 8)
}

export function drawRunway(ctx: CanvasRenderingContext2D, r: RunwayInfo, p: Project): void {
  const len = r.lengthM / NM_TO_M
  const h = deg2rad(r.headingDeg)
  const ex = r.x + len * Math.sin(h)
  const ey = r.y + len * Math.cos(h)
  const [ax, ay] = p(r.x, r.y)
  const [bx, by] = p(ex, ey)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(bx, by)
  ctx.stroke()
  ctx.fillStyle = '#e5e7eb'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(`RWY ${r.ident}`, ax - 10, ay + 16)
}

export function drawAircraft(ctx: CanvasRenderingContext2D, sx: number, sy: number, hdgDeg: number, color = '#facc15'): void {
  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(deg2rad(hdgDeg))
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.lineTo(7, 8)
  ctx.lineTo(0, 4)
  ctx.lineTo(-7, 8)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
