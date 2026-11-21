import { distNm } from '#shared/utils/geo'
import type { AircraftState, NavStation, Objective, VorOutput } from '#shared/types'

export interface ObjCtx { ac: AircraftState; vor1?: VorOutput; stations: NavStation[]; fmsComplete?: boolean }
export interface ObjProgress { heldSec: number }

export function evaluateObjective(obj: Objective, ctx: ObjCtx, prog: ObjProgress, dt: number): { done: boolean; prog: ObjProgress } {
  switch (obj.type) {
    case 'TRACK_RADIAL': {
      const v = ctx.vor1
      const ok = !!v && v.valid && v.ident === obj.stationIdent && v.toFrom === obj.toFrom && Math.abs(v.cdiDevDeg) < 2
      const heldSec = ok ? prog.heldSec + dt : 0
      return { done: heldSec >= obj.holdSec, prog: { heldSec } }
    }
    case 'REACH': {
      const st = ctx.stations.find(s => s.ident === obj.stationIdent && s.type !== 'DME')
      return { done: !!st && distNm(ctx.ac, st) <= obj.withinNm, prog }
    }
    case 'ROUTE':
      return { done: !!ctx.fmsComplete, prog }
    case 'LAND':
      return { done: false, prog }
  }
}

export function objectiveText(obj: Objective, prog: ObjProgress): string {
  switch (obj.type) {
    case 'TRACK_RADIAL': return `Track ${obj.stationIdent} R-${String(obj.radialDeg).padStart(3, '0')} ${obj.toFrom}: ${Math.floor(prog.heldSec)}/${obj.holdSec} s`
    case 'REACH': return `Fly to ${obj.stationIdent} (within ${obj.withinNm} NM)`
    case 'ROUTE': return `Fly the route ${obj.waypoints.join(' → ')}`
    case 'LAND': return `Land on runway ${obj.runwayIdent}`
  }
}
