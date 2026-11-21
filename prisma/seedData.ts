import { toLatLon } from '../shared/utils/geo'
import type { ScenarioConfig, StationType } from '../shared/types'

const ll = (x: number, y: number) => toLatLon({ x, y })

export const airport = { icao: 'XTRN', name: 'SkyNav Training Field', ...ll(0, 0), elevationFt: 900 }

const thr = ll(0, 0)
export const runway = { ident: '09', headingDeg: 90, thresholdLat: thr.lat, thresholdLon: thr.lon, lengthM: 3000, widthM: 45 }

interface SeedStation { type: StationType; ident: string; name: string; frequency: number; x: number; y: number; rangeNm: number; onRunway: boolean }

const st = (type: StationType, ident: string, name: string, frequency: number, x: number, y: number, rangeNm: number, onRunway = false): SeedStation =>
  ({ type, ident, name, frequency, x, y, rangeNm, onRunway })

export const stationsLocal: SeedStation[] = [
  st('VOR', 'TRN', 'Trainer VOR', 113.5, 2, 6, 130),
  st('DME', 'TRN', 'Trainer DME', 113.5, 2, 6, 130),
  st('DVOR', 'ALF', 'Alpha DVOR', 116.2, -40, 25, 130),
  st('DME', 'ALF', 'Alpha DME', 116.2, -40, 25, 130),
  st('NDB', 'NB', 'November NDB', 350, -25, -12, 50),
  st('ILS_LOC', 'ITRN', 'ILS 09 LOC', 110.3, 1.8, 0, 25, true),
  st('ILS_GS', 'ITRN', 'ILS 09 GS', 110.3, 0.16, -0.08, 10, true),
  st('MARKER_OM', 'OM', 'Outer Marker', 75, -4.5, 0, 1, true),
  st('MARKER_MM', 'MM', 'Middle Marker', 75, -0.6, 0, 1, true),
  st('MARKER_IM', 'IM', 'Inner Marker', 75, -0.15, 0, 1, true),
]

export const stations = stationsLocal.map(({ x, y, onRunway, ...rest }) => ({ ...rest, ...ll(x, y), onRunway }))

export const waypoints = [
  { ident: 'WP1', ...ll(-30, 0) },
  { ident: 'WP2', ...ll(-30, 20) },
  { ident: 'WP3', ...ll(-10, 20) },
]

export const users = [
  { name: 'Admin', email: 'admin@skynav.local', password: 'admin1234', role: 'ADMIN' as const },
  { name: 'Student', email: 'student@skynav.local', password: 'student1234', role: 'STUDENT' as const },
]

const air = { onGround: false, gearDown: false, iasKt: 120, throttle: 120 / 140 }
const cfg = (c: Partial<ScenarioConfig> & Pick<ScenarioConfig, 'target'>): ScenarioConfig =>
  ({ startState: {}, wind: null, failures: [], traffic: [], radios: {}, ...c })

const ilsStart = { ...air, x: -12, y: 1.0, altFt: 3400, hdgDeg: 120, flapsDeg: 10 as const }
const fmsStart = { ...air, x: -25, y: -5, altFt: 4900, hdgDeg: 0 }

export const scenarios: { title: string; description: string; week: number; config: ScenarioConfig }[] = [
  { week: 1, title: 'Free flight', description: 'Take off from runway 09, fly anywhere and land back.',
    config: cfg({ target: { type: 'LAND', runwayIdent: '09' }, radios: { nav1MHz: 113.5, obsDeg: 90 } }) },
  { week: 1, title: 'VOR radial tracking', description: 'Intercept the TRN 270 radial and fly inbound (course 090) for 60 seconds.',
    config: cfg({ startState: { ...air, x: -15, y: -5, altFt: 3900, hdgDeg: 60 }, target: { type: 'TRACK_RADIAL', stationIdent: 'TRN', radialDeg: 270, toFrom: 'TO', holdSec: 60 }, radios: { nav1MHz: 113.5, obsDeg: 90 } }) },
  { week: 2, title: 'VOR to VOR', description: 'Navigate from TRN to the ALF DVOR using VOR/DME and the RMI.',
    config: cfg({ startState: { ...air, x: 5, y: 10, altFt: 4900, hdgDeg: 300 }, target: { type: 'REACH', stationIdent: 'ALF', withinNm: 1 }, radios: { nav1MHz: 116.2 }, atmosphere: { qnhHpa: 1022, isaDevC: -10 } }) },
  { week: 2, title: 'NDB homing', description: 'Home to the NB NDB with the ADF in a 15 kt westerly wind.',
    config: cfg({ startState: { ...air, x: 0, y: 10, altFt: 3900, hdgDeg: 180 }, target: { type: 'REACH', stationIdent: 'NB', withinNm: 0.5 }, radios: { adfKHz: 350 }, wind: { fromDeg: 270, speedKt: 15 }, atmosphere: { qnhHpa: 1003, isaDevC: 15 } }) },
  { week: 3, title: 'ILS approach 09', description: 'Intercept the ILS 09 localiser and glide slope and land by hand.',
    config: cfg({ startState: ilsStart, target: { type: 'LAND', runwayIdent: '09' }, radios: { nav1MHz: 110.3, obsDeg: 90 } }) },
  { week: 4, title: 'Autopilot coupled ILS', description: 'Use APP mode to fly a coupled ILS approach, then land.',
    config: cfg({ startState: ilsStart, target: { type: 'LAND', runwayIdent: '09' }, radios: { nav1MHz: 110.3, obsDeg: 90 } }) },
  { week: 5, title: 'FMS route', description: 'Fly WP1 → WP2 → WP3 in LNAV while watching INS drift and GPS correction.',
    config: cfg({ startState: fmsStart, target: { type: 'ROUTE', waypoints: ['WP1', 'WP2', 'WP3'] } }) },
  { week: 6, title: 'TCAS encounter', description: 'Fly to TRN; resolve the traffic conflict following TCAS.',
    config: cfg({ startState: { ...air, x: -20, y: 0, altFt: 4900, hdgDeg: 90 }, target: { type: 'REACH', stationIdent: 'TRN', withinNm: 1 }, radios: { nav1MHz: 113.5 },
      traffic: [{ id: 'T1', x: 0, y: 0, altFt: 4900, trackDeg: 270, gsKt: 150, vsFpm: 0 }] }) },
  { week: 6, title: 'GPS + VOR failure', description: 'Fly the FMS route; GPS fails at 60 s and the VOR at 120 s.',
    config: cfg({ startState: fmsStart, target: { type: 'ROUTE', waypoints: ['WP1', 'WP2', 'WP3'] }, radios: { nav1MHz: 113.5 },
      failures: [{ type: 'GPS', atSec: 60 }, { type: 'VOR', atSec: 120 }] }) },
]
