import { DEFAULT_STATE } from '../../../app/sim/flightModel'
import { AIRPORT_ELEV_FT } from '../../../shared/utils/units'
import type { AircraftState, NavStation, RunwayInfo, StationType } from '../../../shared/types'

/** Synthetic test field (local NM, origin = runway 09 threshold). Independent of the real VOBL seed. */
const raw: [StationType, string, number, number, number, number, boolean][] = [
  ['VOR', 'TRN', 113.5, 2, 6, 130, false],
  ['DME', 'TRN', 113.5, 2, 6, 130, false],
  ['DVOR', 'ALF', 116.2, -40, 25, 130, false],
  ['DME', 'ALF', 116.2, -40, 25, 130, false],
  ['NDB', 'NB', 350, -25, -12, 50, false],
  ['ILS_LOC', 'ITRN', 110.3, 1.8, 0, 25, true],
  ['ILS_GS', 'ITRN', 110.3, 0.16, -0.08, 10, true],
  ['MARKER_OM', 'OM', 75, -4.5, 0, 1, true],
  ['MARKER_MM', 'MM', 75, -0.6, 0, 1, true],
  ['MARKER_IM', 'IM', 75, -0.15, 0, 1, true],
]

export const SEED_STATIONS: NavStation[] = raw.map(([type, ident, frequency, x, y, rangeNm, rw], i) => ({
  id: i + 1, type, ident, name: ident, frequency, x, y, rangeNm, runwayId: rw ? 1 : null,
}))

export const RWY09: RunwayInfo = { id: 1, ident: '09', headingDeg: 90, x: 0, y: 0, lengthM: 3000, widthM: 45 }

export const air = (p: Partial<AircraftState> = {}): AircraftState =>
  ({ ...DEFAULT_STATE, onGround: false, gearDown: false, iasKt: 120, throttle: 120 / 140, altFt: AIRPORT_ELEV_FT + 3000, ...p })

export const station = (p: Partial<NavStation>): NavStation =>
  ({ id: 99, type: 'VOR', ident: 'TST', name: 'Test', frequency: 113.5, x: 0, y: 0, rangeNm: 130, runwayId: null, ...p })
