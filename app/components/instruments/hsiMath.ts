import type { IlsOutput, NavStation, RunwayInfo, ToFrom, VorOutput } from '../../../shared/types'
import { tunedLocaliser } from '../../nav/ils'

export interface HsiInput {
  mode: 'VOR' | 'LOC'
  courseDeg: number
  devFrac: number // −1..1, positive = course is to the right (fly right)
  navValid: boolean
  toFrom: ToFrom
  gsValid: boolean
  gsFrac: number // positive = glide path above you (fly up)
  ident: string
}

/** Decides what the HSI shows: the ILS when NAV 1 is tuned to a localiser, otherwise the VOR and its OBS. */
export function hsiInput(stations: NavStation[], runways: RunwayInfo[], nav1MHz: number, obsDeg: number, ac: { x: number; y: number }, vor?: VorOutput, ils?: IlsOutput): HsiInput {
  const tuned = tunedLocaliser(stations, runways, nav1MHz, ac)
  if (tuned) {
    return {
      mode: 'LOC', courseDeg: tuned.runway.headingDeg, devFrac: ils?.locValid ? ils.locFrac : 0, navValid: !!ils?.locValid,
      toFrom: 'OFF', gsValid: !!ils?.gsValid, gsFrac: ils?.gsValid ? ils.gsFrac : 0, ident: tuned.loc.ident,
    }
  }
  const ok = !!vor?.valid && vor.toFrom !== 'OFF'
  return { mode: 'VOR', courseDeg: obsDeg, devFrac: ok ? vor!.cdiFrac : 0, navValid: ok, toFrom: ok ? vor!.toFrom : 'OFF', gsValid: false, gsFrac: 0, ident: vor?.valid ? vor.ident : '' }
}

/** Offset (px) of the deviation bar: full scale = 2 dots. */
export const hsiBarOffsetPx = (devFrac: number, dotPx: number): number => Math.max(-1, Math.min(1, devFrac)) * 2 * dotPx
