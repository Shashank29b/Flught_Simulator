import { describe, expect, it } from 'vitest'
import { evaluateObjective, type ObjProgress } from '../../app/sim/objectives'
import type { Objective, VorOutput } from '../../shared/types'
import { SEED_STATIONS, air } from './helpers/fixtures'

const track: Objective = { type: 'TRACK_RADIAL', stationIdent: 'TRN', radialDeg: 270, toFrom: 'TO', holdSec: 60 }
const vor = (dev: number): VorOutput => ({ valid: true, ident: 'TRN', radialDeg: 270, obsDeg: 90, toFrom: 'TO', cdiDevDeg: dev, cdiFrac: dev / 10 })

function feed(devs: number[]): { done: boolean; prog: ObjProgress } {
  let r = { done: false, prog: { heldSec: 0 } }
  for (const d of devs) r = evaluateObjective(track, { ac: air(), vor1: vor(d), stations: [] }, r.prog, 1)
  return r
}

describe('objectives', () => {
  it('O1 holds the radial for 60 s', () => expect(feed(Array(61).fill(1)).done).toBe(true))
  it('O2 resets on a bad second', () => {
    const r = feed([...Array(30).fill(1), 5, ...Array(30).fill(1)])
    expect(r.done).toBe(false)
    expect(r.prog.heldSec).toBe(30)
  })
  it('REACH within 0.5 NM', () => {
    const nb = SEED_STATIONS.find(s => s.ident === 'NB')!
    const r = evaluateObjective({ type: 'REACH', stationIdent: 'NB', withinNm: 0.5 }, { ac: air({ x: nb.x + 0.4, y: nb.y }), stations: SEED_STATIONS }, { heldSec: 0 }, 1)
    expect(r.done).toBe(true)
  })
})
