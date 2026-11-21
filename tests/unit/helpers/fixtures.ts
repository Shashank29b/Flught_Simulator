import { DEFAULT_STATE } from '../../../app/sim/flightModel'
import { stationsLocal } from '../../../prisma/seedData'
import type { AircraftState, NavStation, RunwayInfo } from '../../../shared/types'

export const SEED_STATIONS: NavStation[] = stationsLocal.map((s, i) => ({
  id: i + 1, type: s.type, ident: s.ident, name: s.name, frequency: s.frequency,
  x: s.x, y: s.y, rangeNm: s.rangeNm, runwayId: s.onRunway ? 1 : null,
}))

export const RWY09: RunwayInfo = { id: 1, ident: '09', headingDeg: 90, x: 0, y: 0, lengthM: 3000, widthM: 45 }

export const air = (p: Partial<AircraftState> = {}): AircraftState =>
  ({ ...DEFAULT_STATE, onGround: false, gearDown: false, iasKt: 120, throttle: 120 / 140, altFt: 3900, ...p })

export const station = (p: Partial<NavStation>): NavStation =>
  ({ id: 99, type: 'VOR', ident: 'TST', name: 'Test', frequency: 113.5, x: 0, y: 0, rangeNm: 130, runwayId: null, ...p })
