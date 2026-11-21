import { AIRPORT_ELEV_FT, NM_TO_FT, deg2rad } from '../../shared/utils/units'
import type { AircraftState } from '../../shared/types'
import type { Radios } from './engine'

export interface Preset { id: string; label: string; ac: Partial<AircraftState>; radios?: Partial<Radios> }

const cruise = { onGround: false, gearDown: false, iasKt: 120, throttle: 120 / 140, flapsDeg: 0 as const }
/** Height on a 3° glide path at a distance from the 09L GS antenna (≈ 300 m past the threshold). */
const onGlidePath = (distNm: number) => AIRPORT_ELEV_FT + distNm * NM_TO_FT * Math.tan(deg2rad(3))

export const PRESETS: Preset[] = [
  { id: 'runway', label: 'Runway 09L (take-off)', ac: { x: -0.2, y: 0, hdgDeg: 90.5, onGround: true, gearDown: true, altFt: AIRPORT_ELEV_FT } },
  { id: 'cruise', label: 'Airborne 6000 ft', ac: { ...cruise, x: -10, y: 2, altFt: 6000, hdgDeg: 90 } },
  { id: 'ils', label: 'ILS 09L final (8 NM)', ac: { ...cruise, x: -8 * Math.sin(deg2rad(90.5)), y: -8 * Math.cos(deg2rad(90.5)), altFt: onGlidePath(8.16), hdgDeg: 90.5, iasKt: 110, throttle: 0.6, gearDown: true, flapsDeg: 20 }, radios: { nav1MHz: 110.3, obsDeg: 90 } },
  { id: 'vor', label: 'North of BBG VOR', ac: { ...cruise, x: -3, y: -2, altFt: 7000, hdgDeg: 180 }, radios: { nav1MHz: 115.5, obsDeg: 180 } },
  { id: 'ndb', label: 'East of YH NDB', ac: { ...cruise, x: 12, y: -3, altFt: 6500, hdgDeg: 270 }, radios: { adfKHz: 223 } },
]
