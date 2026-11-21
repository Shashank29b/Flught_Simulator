/**
 * Automatic journey: take-off → climb → cruise → descent → approach (centreline capture) → 3° final → flare → rollout.
 * Produces the same Controls a pilot would (roll/pitch/throttle), plus gear and flap selections. Pure.
 */
import { KT_TO_FPM, NM_TO_FT, clamp, deg2rad, rad2deg, wrap180 } from '../../shared/utils/units'
import { distNm, toLocal, type LatLon, type Vec2 } from '../../shared/utils/geo'
import type { AircraftState, Controls } from '../../shared/types'
import { JET, type AircraftProfile } from './aircraft'

export interface JourneyEnd {
  ident: string
  name: string
  elevationFt: number
  runway: { ident: string; headingDeg: number; lat: number; lon: number; lengthM: number }
}
export interface Journey { from: JourneyEnd; to: JourneyEnd; cruiseAltFt: number }

export type Phase = 'TAKEOFF_ROLL' | 'ROTATE' | 'CLIMB' | 'CRUISE' | 'DESCENT' | 'APPROACH' | 'FINAL' | 'FLARE' | 'ROLLOUT' | 'ARRIVED'
export interface AutoState { phase: Phase }
export interface AutoOutput { auto: AutoState; controls: Controls; gearDown: boolean; flapsDeg: 0 | 10 | 20 | 30 }

const TAN3 = Math.tan(deg2rad(3))
function phaseSpeed(p: AircraftProfile, phase: Phase): number {
  const s = p.speeds
  return ({ TAKEOFF_ROLL: p.maxIasKt, ROTATE: p.maxIasKt, CLIMB: s.climb, CRUISE: s.cruise, DESCENT: s.descent, APPROACH: s.approach, FINAL: s.final, FLARE: s.flare, ROLLOUT: 0, ARRIVED: 0 } as const)[phase]
}

export interface RunwayRel { thr: Vec2; u: Vec2; hdgDeg: number; along: number; xte: number; distToThr: number }

/** Aircraft position relative to a runway: along (+ toward the far end), xte (+ = right of the centreline). */
export function runwayRel(end: JourneyEnd, ac: Vec2, ref: LatLon): RunwayRel {
  const thr = toLocal({ lat: end.runway.lat, lon: end.runway.lon }, ref)
  const h = deg2rad(end.runway.headingDeg)
  const u = { x: Math.sin(h), y: Math.cos(h) }
  const rx = ac.x - thr.x
  const ry = ac.y - thr.y
  const along = rx * u.x + ry * u.y
  return { thr, u, hdgDeg: end.runway.headingDeg, along, xte: rx * u.y - ry * u.x, distToThr: -along }
}

/** Height of the 3° glide path (50 ft over the threshold). */
export function glidePathAltFt(end: JourneyEnd, distToThrNm: number): number {
  return end.elevationFt + 50 + Math.max(0, distToThrNm) * NM_TO_FT * TAN3
}

const altHold = (target: number, alt: number) => clamp(4 * (target - alt), -1500, 1500)
const courseLaw = (rel: RunwayRel, gain: number, max: number) => rel.hdgDeg - clamp(gain * rel.xte, -max, max)

export function autoflightStep(j: Journey, a: AutoState, ac: AircraftState, ref: LatLon, groundElevFt: number, prof: AircraftProfile = JET): AutoOutput {
  const IF_NM = prof.ifNm
  const rel = runwayRel(j.to, ac, ref)
  const ifPt = { x: rel.thr.x - IF_NM * rel.u.x, y: rel.thr.y - IF_NM * rel.u.y }
  const ifAlt = j.to.elevationFt + prof.ifHeightFt
  const pathAlt = glidePathAltFt(j.to, rel.distToThr)
  const agl = ac.altFt - groundElevFt
  const directIf = () => {
    const b = rad2deg(Math.atan2(ifPt.x - ac.x, ifPt.y - ac.y))
    return b
  }
  const captured = () =>
    distNm(ac, ifPt) < 1.5
    || (rel.along <= -2 && rel.along >= -(IF_NM + 4) && Math.abs(rel.xte) < 2 && Math.abs(wrap180(ac.hdgDeg - rel.hdgDeg)) < 100)
  const shouldDescend = () => distNm(ac, ifPt) <= ((ac.altFt - ifAlt) / prof.descentFpm) * (Math.max(ac.gsKt, 80) / 60) + 5

  let phase = a.phase
  let gearDown = ac.gearDown
  let flapsDeg = ac.flapsDeg
  let hdgCmd = ac.hdgDeg
  let vsCmd = 0
  let pitchOverride: number | null = null
  let maxBank = 25

  switch (phase) {
    case 'TAKEOFF_ROLL':
      flapsDeg = 10
      pitchOverride = 0
      if (ac.iasKt >= prof.rotateKt + 5) phase = 'ROTATE'
      break
    case 'ROTATE':
      pitchOverride = 10
      if (!ac.onGround && agl > 50) phase = 'CLIMB'
      break
    case 'CLIMB':
      if (agl > 300) gearDown = false
      if (agl > 1000) flapsDeg = 0
      hdgCmd = agl > 500 ? directIf() : ac.hdgDeg
      vsCmd = prof.climbFpm
      if (ac.altFt >= j.cruiseAltFt - 100) phase = 'CRUISE'
      if (agl > 1500 && shouldDescend()) phase = 'DESCENT'
      break
    case 'CRUISE':
      hdgCmd = directIf()
      vsCmd = altHold(j.cruiseAltFt, ac.altFt)
      if (shouldDescend()) phase = 'DESCENT'
      if (captured()) phase = 'APPROACH'
      break
    case 'DESCENT':
      hdgCmd = directIf()
      vsCmd = ac.altFt > ifAlt + 150 ? -prof.descentFpm : altHold(ifAlt, ac.altFt)
      if (captured()) phase = 'APPROACH'
      break
    case 'APPROACH':
      gearDown = true
      flapsDeg = 20
      hdgCmd = courseLaw(rel, 25, 40)
      vsCmd = ac.altFt > ifAlt + 150 ? -prof.descentFpm : altHold(Math.min(ifAlt, ac.altFt + 1), ac.altFt)
      if (rel.distToThr < IF_NM + 2 && ac.altFt >= pathAlt - 20 && Math.abs(rel.xte) < 0.5) phase = 'FINAL'
      break
    case 'FINAL':
      flapsDeg = 30
      maxBank = 15
      hdgCmd = courseLaw(rel, 40, 30)
      vsCmd = clamp(-ac.gsKt * KT_TO_FPM * TAN3 + 3 * (pathAlt - ac.altFt), -1500, 300)
      if (agl < 40) phase = 'FLARE'
      break
    case 'FLARE':
      maxBank = 5
      hdgCmd = courseLaw(rel, 40, 10)
      vsCmd = -150
      if (ac.onGround) phase = 'ROLLOUT'
      break
    case 'ROLLOUT':
      pitchOverride = 0
      if (ac.iasKt < 3) phase = 'ARRIVED'
      break
    case 'ARRIVED':
      pitchOverride = 0
      break
  }

  const ias = phaseSpeed(prof, phase)
  const throttle = phase === 'FLARE' && agl < 20 ? 0 : clamp(ias / prof.maxIasKt, 0, 1)
  const bankCmd = ac.onGround ? 0 : clamp(2 * wrap180(hdgCmd - ac.hdgDeg), -maxBank, maxBank)
  const tas = Math.max(ac.tasKt || ac.iasKt, 40)
  const pitchCmd = pitchOverride ?? rad2deg(Math.asin(clamp(vsCmd / (tas * KT_TO_FPM), -1, 1)))
  return {
    auto: { phase },
    controls: {
      roll: clamp((bankCmd - ac.bankDeg) / 10, -1, 1),
      pitch: clamp((pitchCmd - ac.pitchDeg) / 5, -1, 1),
      throttle,
    },
    gearDown,
    flapsDeg,
  }
}

/** Ground elevation to use during a journey: the departure or destination field when within 40 NM. */
export function journeyGroundElev(j: Journey, ac: Vec2, ref: LatLon, current: number): number {
  const d = distNm(ac, toLocal({ lat: j.to.runway.lat, lon: j.to.runway.lon }, ref))
  if (d < 40) return j.to.elevationFt
  const o = distNm(ac, toLocal({ lat: j.from.runway.lat, lon: j.from.runway.lon }, ref))
  if (o < 40) return j.from.elevationFt
  return current
}

/** Great-circle distance between the two thresholds (NM). */
export function journeyDistanceNm(j: Journey): number {
  const r = Math.PI / 180
  const a = j.from.runway
  const b = j.to.runway
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2
  return 2 * 3440.065 * Math.asin(Math.min(1, Math.sqrt(h)))
}
