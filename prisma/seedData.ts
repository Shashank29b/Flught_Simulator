/**
 * VOBL Kempegowda International (Bengaluru) training dataset.
 * Airport, runway and navaid data: OurAirports (https://ourairports.com/data/, public domain), retrieved 2026-11-21.
 * ILS/marker installations and FMS waypoints are TRAINING placements derived from runway geometry; they are
 * NOT the real published procedures. Not for real-world navigation.
 */
import { bearingDeg, distNm, toLatLon, toLocal, type LatLon, type Vec2 } from '../shared/utils/geo'
import { NM_TO_M, deg2rad } from '../shared/utils/units'
import type { ScenarioConfig, StationType } from '../shared/types'

export const airport = { icao: 'VOBL', name: 'Kempegowda International Airport Bengaluru', lat: 13.1979, lon: 77.706299, elevationFt: 3000 }

interface RunwayPair { le: string; he: string; leLL: LatLon; heLL: LatLon; lengthM: number; widthM: number; ils?: { freq: number; ident: string } }
const pairs: RunwayPair[] = [
  { le: '09L', he: '27R', leLL: { lat: 13.207164, lon: 77.686073 }, heLL: { lat: 13.206847, lon: 77.722969 }, lengthM: 4000, widthM: 45, ils: { freq: 110.3, ident: 'IBLA' } },
  { le: '09R', he: '27L', leLL: { lat: 13.189734, lon: 77.68998 }, heLL: { lat: 13.189414, lon: 77.726875 }, lengthM: 4000, widthM: 45, ils: { freq: 109.9, ident: 'IBLB' } },
]

export interface SeedRunway { ident: string; headingDeg: number; thresholdLat: number; thresholdLon: number; lengthM: number; widthM: number }
export interface SeedStation { type: StationType; ident: string; name: string; frequency: number; lat: number; lon: number; rangeNm: number; runwayIdent: string | null }

const r1 = (v: number) => Math.round(v * 10) / 10
export const runways: SeedRunway[] = pairs.flatMap((p) => {
  const a = toLocal(p.leLL)
  const b = toLocal(p.heLL)
  return [
    { ident: p.le, headingDeg: r1(bearingDeg(a, b)), thresholdLat: p.leLL.lat, thresholdLon: p.leLL.lon, lengthM: p.lengthM, widthM: p.widthM },
    { ident: p.he, headingDeg: r1(bearingDeg(b, a)), thresholdLat: p.heLL.lat, thresholdLon: p.heLL.lon, lengthM: p.lengthM, widthM: p.widthM },
  ]
})

/** Point along the runway axis from the threshold (alongNm > 0 = toward the far end), offset right (rightNm). */
function onAxis(thr: Vec2, hdgDeg: number, alongNm: number, rightNm = 0): LatLon {
  const h = deg2rad(hdgDeg)
  return toLatLon({ x: thr.x + alongNm * Math.sin(h) + rightNm * Math.cos(h), y: thr.y + alongNm * Math.cos(h) - rightNm * Math.sin(h) })
}

function ilsStations(p: RunwayPair): SeedStation[] {
  if (!p.ils) return []
  const thr = toLocal(p.leLL)
  const hdg = bearingDeg(thr, toLocal(p.heLL))
  const len = distNm(thr, toLocal(p.heLL))
  const s = (type: StationType, ident: string, name: string, frequency: number, ll: LatLon, rangeNm: number): SeedStation =>
    ({ type, ident, name, frequency, ...ll, rangeNm, runwayIdent: p.le })
  return [
    s('ILS_LOC', p.ils.ident, `ILS ${p.le} LOC (training)`, p.ils.freq, onAxis(thr, hdg, len + 300 / NM_TO_M), 25),
    s('ILS_GS', p.ils.ident, `ILS ${p.le} GS (training)`, p.ils.freq, onAxis(thr, hdg, 300 / NM_TO_M, 150 / NM_TO_M), 10),
    s('MARKER_OM', `O${p.le}`, `Outer Marker ${p.le}`, 75, onAxis(thr, hdg, -4.5), 1),
    s('MARKER_MM', `M${p.le}`, `Middle Marker ${p.le}`, 75, onAxis(thr, hdg, -0.6), 1),
    s('MARKER_IM', `I${p.le}`, `Inner Marker ${p.le}`, 75, onAxis(thr, hdg, -0.15), 1),
  ]
}

/** OurAirports navaids within 160 NM of VOBL. VOR-DME rows become a VOR + a paired DME. */
const navaids: [string, 'VOR-DME' | 'NDB', number, string, number, number][] = [
  ['YH', 'NDB', 223, 'Yelahanka', 13.151399612426758, 77.6155014038086],
  ['BG', 'NDB', 363, 'Bangalore', 12.969499588012695, 77.71410369873047],
  ['BBG', 'VOR-DME', 115.5, 'Bangalore', 12.949700355529785, 77.68099975585938],
  ['SAI', 'NDB', 241, 'Sri Sathya Sai', 14.149900436401367, 77.78459930419922],
  ['TTP', 'VOR-DME', 115.7, 'Tirupati', 13.634400367736816, 79.53910064697266],
  ['KKP', 'VOR-DME', 115.4, 'Kancheepuram', 12.784899711608887, 79.71309661865234],
  ['BI', 'NDB', 310, 'Bellary', 15.158900260925293, 76.88610076904297],
  ['BBI', 'VOR-DME', 112.8, 'Bellary', 15.16510009765625, 76.88059997558594],
  ['CCB', 'VOR-DME', 112.9, 'Coimbatore', 11.03380012512207, 77.04810333251953],
  ['CB', 'NDB', 354, 'Coimbatore', 11.023799896240234, 77.04720306396484],
  ['MA', 'NDB', 228, 'Chennai', 12.955599784851074, 80.07489776611328],
  ['OM', 'NDB', 385, 'Pondicherry', 11.96619987487793, 79.80979919433594],
  ['MMV', 'VOR-DME', 112.5, 'Chennai', 12.993399620056152, 80.17070007324219],
  ['TTR', 'VOR-DME', 113.1, 'Tiruchirappalli', 10.762399673461914, 78.7134017944336],
  ['TR', 'NDB', 307, 'Tiruchirappalli', 10.749899864196777, 78.68840026855469],
]

/** VOBL-area navaids (fallback when the world dataset is not downloaded). */
export const navaidStations: SeedStation[] = [
  ...navaids.flatMap(([ident, kind, freq, name, lat, lon]): SeedStation[] => kind === 'NDB'
    ? [{ type: 'NDB', ident, name: `${name} NDB`, frequency: freq, lat, lon, rangeNm: 50, runwayIdent: null }]
    : [
        { type: 'VOR', ident, name: `${name} VOR`, frequency: freq, lat, lon, rangeNm: 130, runwayIdent: null },
        { type: 'DME', ident, name: `${name} DME`, frequency: freq, lat, lon, rangeNm: 130, runwayIdent: null },
      ]),
]

/** Training ILS + markers for VOBL 09L/09R (always seeded). */
export const trainingIls: SeedStation[] = pairs.flatMap(ilsStations)

export const stations: SeedStation[] = [...navaidStations, ...trainingIls]

const ll = (x: number, y: number) => toLatLon({ x, y })
/** Training fixes (fictional), local NM from the 09L threshold. */
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
const ils09L = { ...air, x: -12, y: 1.0, altFt: 5500, hdgDeg: 120, flapsDeg: 10 as const }
const ils09R = { ...air, x: -11.8, y: -2.1, altFt: 5500, hdgDeg: 60, flapsDeg: 10 as const }
const fmsStart = { ...air, x: -25, y: -5, altFt: 7000, hdgDeg: 0 }

export const scenarios: { title: string; description: string; week: number; config: ScenarioConfig }[] = [
  { week: 1, title: 'Free flight from VOBL', description: 'Take off from runway 09L at Bengaluru, fly around and land back.',
    config: cfg({ target: { type: 'LAND', runwayIdent: '09L' }, radios: { nav1MHz: 115.5, obsDeg: 180, adfKHz: 223 } }) },
  { week: 1, title: 'BBG VOR radial tracking', description: 'Intercept the BBG R-360 and fly inbound (course 180) for 60 seconds.',
    config: cfg({ startState: { ...air, x: -10, y: 0, altFt: 6000, hdgDeg: 150 }, target: { type: 'TRACK_RADIAL', stationIdent: 'BBG', radialDeg: 0, toFrom: 'TO', holdSec: 60 }, radios: { nav1MHz: 115.5, obsDeg: 180 } }) },
  { week: 2, title: 'Fly to the BBG VOR', description: 'Navigate to the BBG VOR-DME (Bangalore HAL) using VOR/DME and the RMI.',
    config: cfg({ startState: { ...air, x: -20, y: 10, altFt: 7000, hdgDeg: 120 }, target: { type: 'REACH', stationIdent: 'BBG', withinNm: 1 }, radios: { nav1MHz: 115.5 }, atmosphere: { qnhHpa: 1022, isaDevC: -10 } }) },
  { week: 2, title: 'YH NDB homing', description: 'Home to the Yelahanka (YH 223 kHz) NDB with the ADF in a 15 kt westerly on a hot day.',
    config: cfg({ startState: { ...air, x: 15, y: 10, altFt: 6000, hdgDeg: 270 }, target: { type: 'REACH', stationIdent: 'YH', withinNm: 0.5 }, radios: { adfKHz: 223 }, wind: { fromDeg: 270, speedKt: 15 }, atmosphere: { qnhHpa: 1003, isaDevC: 15 } }) },
  { week: 3, title: 'ILS approach 09L', description: 'Intercept the 09L localiser (IBLA 110.30, training) and glide slope, and land by hand.',
    config: cfg({ startState: ils09L, target: { type: 'LAND', runwayIdent: '09L' }, radios: { nav1MHz: 110.3, obsDeg: 90 } }) },
  { week: 4, title: 'Autopilot coupled ILS 09R', description: 'Use APP mode to fly a coupled ILS to 09R (IBLB 109.90, training), then land.',
    config: cfg({ startState: ils09R, target: { type: 'LAND', runwayIdent: '09R' }, radios: { nav1MHz: 109.9, obsDeg: 90 } }) },
  { week: 5, title: 'FMS route', description: 'Fly WP1 → WP2 → WP3 in LNAV while watching INS drift and GPS correction.',
    config: cfg({ startState: fmsStart, target: { type: 'ROUTE', waypoints: ['WP1', 'WP2', 'WP3'] } }) },
  { week: 6, title: 'TCAS encounter', description: 'Fly to the YH NDB; resolve the traffic conflict following TCAS.',
    config: cfg({ startState: { ...air, x: -25, y: -3.35, altFt: 8000, hdgDeg: 90 }, target: { type: 'REACH', stationIdent: 'YH', withinNm: 1 }, radios: { adfKHz: 223 },
      traffic: [{ id: 'T1', x: 5, y: -3.35, altFt: 8000, trackDeg: 270, gsKt: 150, vsFpm: 0 }] }) },
  { week: 6, title: 'GPS + VOR failure', description: 'Fly the FMS route; GPS fails at 60 s and the VOR at 120 s.',
    config: cfg({ startState: fmsStart, target: { type: 'ROUTE', waypoints: ['WP1', 'WP2', 'WP3'] }, radios: { nav1MHz: 115.5 },
      failures: [{ type: 'GPS', atSec: 60 }, { type: 'VOR', atSec: 120 }] }) },
]
