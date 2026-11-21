export interface AircraftState {
  x: number
  y: number
  altFt: number
  hdgDeg: number
  iasKt: number              // indicated (= calibrated) airspeed
  tasKt: number              // true airspeed from ISA (CONTRACTS §1b)
  mach: number
  pitchDeg: number
  bankDeg: number
  vsFpm: number
  gsKt: number
  trackDeg: number
  throttle: number
  fuelPct: number
  gearDown: boolean
  flapsDeg: 0 | 10 | 20 | 30
  onGround: boolean
}

export interface Controls { roll: number; pitch: number; throttle: number }
export interface Wind { fromDeg: number; speedKt: number }
export interface Atmosphere { qnhHpa: number; isaDevC: number }

export type StationType =
  | 'VOR' | 'DVOR' | 'DME' | 'NDB' | 'ILS_LOC' | 'ILS_GS' | 'MARKER_OM' | 'MARKER_MM' | 'MARKER_IM'

export interface NavStation {
  id: number
  type: StationType
  ident: string
  name: string
  frequency: number
  x: number
  y: number
  rangeNm: number
  runwayId: number | null
}

export interface AirportInfo {
  id: number
  ident: string
  name: string
  iata: string | null
  type: string
  x: number
  y: number
  elevationFt: number
}

export interface RunwayInfo {
  id: number
  airportId?: number
  ident: string
  headingDeg: number
  x: number
  y: number
  lengthM: number
  widthM: number
}

export type ToFrom = 'TO' | 'FROM' | 'OFF'
export interface VorOutput { valid: boolean; ident: string; radialDeg: number; obsDeg: number; toFrom: ToFrom; cdiDevDeg: number; cdiFrac: number }
export interface DmeOutput { valid: boolean; distNm: number }
export interface AdfOutput { valid: boolean; ident: string; relBearingDeg: number; bearingToDeg: number }
export interface IlsOutput { locValid: boolean; locDevDeg: number; locFrac: number; gsValid: boolean; gsDevDeg: number; gsFrac: number }
export interface MarkerOutput { om: boolean; mm: boolean; im: boolean }
export interface NavOutputs {
  vor1: VorOutput
  dme1: DmeOutput
  adf: AdfOutput
  ils: IlsOutput
  markers: MarkerOutput
  raFt: number | null
}

export type FlightResult = 'IN_PROGRESS' | 'LANDED' | 'CRASHED' | 'COMPLETED' | 'ABORTED'

export type Objective =
  | { type: 'TRACK_RADIAL'; stationIdent: string; radialDeg: number; toFrom: 'TO' | 'FROM'; holdSec: number }
  | { type: 'REACH'; stationIdent: string; withinNm: number }
  | { type: 'LAND'; runwayIdent: string }
  | { type: 'ROUTE'; waypoints: string[] }

export type FailureType = 'VOR' | 'GPS' | 'ENGINE'

export interface Intruder { id: string; x: number; y: number; altFt: number; trackDeg: number; gsKt: number; vsFpm: number }

export interface ScenarioConfig {
  startState: Partial<AircraftState>
  target: Objective
  wind: Wind | null
  failures: { type: FailureType; atSec: number }[]
  traffic: Intruder[]
  radios: { nav1MHz?: number; adfKHz?: number; obsDeg?: number; baroHpa?: number }
  atmosphere?: Atmosphere
}

export interface ScenarioDTO extends ScenarioConfig {
  id: number
  title: string
  description: string
  week: number
}

export interface FlightSampleInput {
  tMs: number
  x: number
  y: number
  altFt: number
  hdgDeg: number
  iasKt: number
  vsFpm: number
  nav: { cdiDevDeg?: number; locDevDeg?: number; locFrac?: number; gsDevDeg?: number; dmeNm?: number }
}
