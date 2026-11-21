import { describe, expect, it } from 'vitest'
import { REBASE_NM, createWorld, rebaseWorld, simStep, type World } from '../../app/sim/engine'
import { runwayRel, type Journey, type JourneyEnd, type Phase } from '../../app/sim/autoflight'
import { DEFAULT_STATE } from '../../app/sim/flightModel'
import { REF, toLatLon } from '../../shared/utils/geo'

const VOBL: JourneyEnd = { ident: 'VOBL', name: 'Bengaluru', elevationFt: 3000, runway: { ident: '09L', headingDeg: 90.5, lat: REF.lat, lon: REF.lon, lengthM: 4000 } }
const dest = (x: number, y: number, hdg: number, elev: number): JourneyEnd => ({ ident: 'TEST', name: 'Test field', elevationFt: elev, runway: { ident: 'XX', headingDeg: hdg, ...toLatLon({ x, y }), lengthM: 3000 } })

interface Result { phases: Phase[]; touchdown: { xteM: number; vsFpm: number; alongM: number } | null; world: World; seconds: number }

function fly(j: Journey, maxSec = 3 * 3600, dt = 0.05): Result {
  let w = createWorld({ ac: { ...DEFAULT_STATE, x: 0.1, y: 0, hdgDeg: 90.5 }, groundElevFt: 3000, journey: j, auto: { phase: 'TAKEOFF_ROLL' } })
  const phases: Phase[] = ['TAKEOFF_ROLL']
  let touchdown: Result['touchdown'] = null
  let t = 0
  while (t < maxSec && w.auto?.phase !== 'ARRIVED') {
    const prev = w
    w = simStep(w, { roll: 0, pitch: 0, throttle: 0 }, dt)
    t += dt
    if (w.auto && w.auto.phase !== phases.at(-1)) phases.push(w.auto.phase)
    if (!touchdown && phases.includes('FLARE') && !prev.ac.onGround && w.ac.onGround) {
      const rel = runwayRel(j.to, w.ac, w.ref)
      touchdown = { xteM: rel.xte * 1852, vsFpm: prev.ac.vsFpm, alongM: rel.along * 1852 }
    }
    if (Math.hypot(w.ac.x, w.ac.y) > REBASE_NM) w = rebaseWorld(w, toLatLon(w.ac, w.ref))
  }
  return { phases, touchdown, world: w, seconds: t }
}

describe('automatic journey', () => {
  it('JY1 flies VOBL 09L to a field 47 NM north-east and lands on the centreline', () => {
    const r = fly({ from: VOBL, to: dest(40, 25, 90, 2000), cruiseAltFt: 8000 })
    expect(r.phases).toEqual(['TAKEOFF_ROLL', 'ROTATE', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'FINAL', 'FLARE', 'ROLLOUT', 'ARRIVED'])
    expect(r.touchdown).not.toBeNull()
    expect(Math.abs(r.touchdown!.xteM)).toBeLessThan(30)
    expect(r.touchdown!.vsFpm).toBeGreaterThan(-500)
    expect(r.touchdown!.alongM).toBeGreaterThan(0)
    expect(r.touchdown!.alongM).toBeLessThan(1500)
    expect(r.world.ac.altFt).toBe(2000)
  })
  it('JY2 handles a destination runway that needs a turnaround', () => {
    const r = fly({ from: VOBL, to: dest(30, 0, 270, 3000), cruiseAltFt: 7000 })
    expect(r.phases.at(-1)).toBe('ARRIVED')
    expect(Math.abs(r.touchdown!.xteM)).toBeLessThan(30)
    expect(r.touchdown!.vsFpm).toBeGreaterThan(-500)
  })
})
