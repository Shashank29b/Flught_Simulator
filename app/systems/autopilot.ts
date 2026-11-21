/**
 * Mode-based autopilot (CONTRACTS §8): lateral HDG / NAV (VOR) / APP (localiser), vertical ALT / VS / GS,
 * optional autothrottle (SPD). Outputs stick commands like a pilot would. Pure.
 */
import { KT_TO_FPM, clamp, deg2rad, rad2deg, wrap180 } from '../../shared/utils/units'
import type { AircraftState, NavOutputs } from '../../shared/types'
import type { AircraftProfile } from '../sim/aircraft'

export type LateralMode = 'HDG' | 'NAV' | 'APP'
export type VerticalMode = 'ALT' | 'VS' | 'GS'

export interface ApState {
  engaged: boolean
  athr: boolean
  lateral: LateralMode
  vertical: VerticalMode
  hdgDeg: number
  altFt: number
  vsFpm: number
  spdKt: number
  navCaptured: boolean // VOR course or localiser captured
  gsCaptured: boolean
}

export interface ApContext { obsDeg: number; rwyHdgDeg: number | null }
export interface ApOutput { ap: ApState; roll: number; pitch: number; throttle: number | null }

export function apFromAircraft(ac: AircraftState): ApState {
  return {
    engaged: true, athr: false, lateral: 'HDG', vertical: 'ALT',
    hdgDeg: Math.round(ac.hdgDeg), altFt: Math.round(ac.altFt / 100) * 100, vsFpm: 0, spdKt: Math.round(ac.iasKt),
    navCaptured: false, gsCaptured: false,
  }
}

const TAN3 = Math.tan(deg2rad(3))

export function apStep(ap: ApState, ac: AircraftState, nav: Partial<NavOutputs>, ctx: ApContext, prof: AircraftProfile): ApOutput {
  const next = { ...ap }
  // ---- lateral
  let hdgCmd = ap.hdgDeg
  if (ap.lateral === 'NAV') {
    const v = nav.vor1
    if (!next.navCaptured && v?.valid && v.toFrom !== 'OFF' && Math.abs(v.cdiFrac) < 0.9) next.navCaptured = true
    if (next.navCaptured && v?.valid && v.toFrom !== 'OFF') hdgCmd = ctx.obsDeg + clamp(4 * v.cdiDevDeg, -30, 30)
  }
  else if (ap.lateral === 'APP') {
    const i = nav.ils
    if (!next.navCaptured && i?.locValid && Math.abs(i.locFrac) < 0.9) next.navCaptured = true
    if (next.navCaptured && i?.locValid && ctx.rwyHdgDeg !== null) hdgCmd = ctx.rwyHdgDeg + clamp(12 * i.locDevDeg, -30, 30)
    if (next.navCaptured && !next.gsCaptured && i?.gsValid && Math.abs(i.gsDevDeg) < 0.15) {
      next.gsCaptured = true
      next.vertical = 'GS'
    }
  }
  const bankCmd = ac.onGround ? 0 : clamp(2 * wrap180(hdgCmd - ac.hdgDeg), -25, 25)

  // ---- vertical
  const maxVs = Math.max(1500, prof.climbFpm)
  let vsCmd: number
  if (next.vertical === 'GS' && nav.ils?.gsValid) {
    vsCmd = -ac.gsKt * KT_TO_FPM * TAN3 + 400 * nav.ils.gsDevDeg
  }
  else if (next.vertical === 'VS') {
    vsCmd = ap.vsFpm
    if (Math.abs(ap.altFt - ac.altFt) < 200 || (ap.vsFpm > 0 && ac.altFt > ap.altFt) || (ap.vsFpm < 0 && ac.altFt < ap.altFt)) {
      next.vertical = 'ALT'
      vsCmd = clamp(4 * (ap.altFt - ac.altFt), -maxVs, maxVs)
    }
  }
  else {
    if (next.vertical === 'GS') next.vertical = 'ALT' // GS lost: hold altitude
    vsCmd = clamp(4 * (ap.altFt - ac.altFt), -maxVs, maxVs)
  }
  const tas = Math.max(ac.tasKt || ac.iasKt, 40)
  const pitchCmd = rad2deg(Math.asin(clamp(vsCmd / (tas * KT_TO_FPM), -1, 1)))

  return {
    ap: next,
    roll: clamp((bankCmd - ac.bankDeg) / 10, -1, 1),
    pitch: clamp((pitchCmd - ac.pitchDeg) / 5, -1, 1),
    throttle: ap.athr ? clamp(ap.spdKt / prof.maxIasKt, 0, 1) : null,
  }
}

/** Short mode annunciation, e.g. "HDG 090 | ALT 6000 | SPD 250". */
export function fma(ap: ApState): { lateral: string; vertical: string; thrust: string; armed: string } {
  const pad = (n: number) => String(Math.round(((n % 360) + 360) % 360)).padStart(3, '0')
  const lateral = ap.lateral === 'HDG' ? `HDG ${pad(ap.hdgDeg)}` : ap.lateral === 'NAV' ? (ap.navCaptured ? 'VOR' : `HDG ${pad(ap.hdgDeg)}`) : (ap.navCaptured ? 'LOC' : `HDG ${pad(ap.hdgDeg)}`)
  const vertical = ap.vertical === 'GS' ? 'G/S' : ap.vertical === 'VS' ? `V/S ${ap.vsFpm > 0 ? '+' : ''}${ap.vsFpm}` : `ALT ${ap.altFt}`
  const armed = [ap.lateral === 'NAV' && !ap.navCaptured ? 'VOR' : '', ap.lateral === 'APP' && !ap.navCaptured ? 'LOC' : '', ap.lateral === 'APP' && !ap.gsCaptured ? 'G/S' : ''].filter(Boolean).join(' ')
  return { lateral, vertical, thrust: ap.athr ? `SPD ${ap.spdKt}` : 'MAN THR', armed }
}
