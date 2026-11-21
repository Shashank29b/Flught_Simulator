import { computed, type Ref } from 'vue'
import { toLocal, type LatLon } from '#shared/utils/geo'
import type { AirportInfo, NavStation, RunwayInfo, StationType } from '#shared/types'

export interface StationRow { id: number; type: StationType; ident: string; name: string; frequency: number; lat: number; lon: number; rangeNm: number; runwayId: number | null }
export interface RunwayRow { id: number; ident: string; headingDeg: number; thresholdLat: number; thresholdLon: number; lengthM: number; widthM: number }
export interface AirportRow { id: number; ident: string; icao: string | null; iata: string | null; name: string; type: string; municipality: string | null; country: string | null; lat: number; lon: number; elevationFt: number; runways: RunwayRow[] }
export interface NavDataRaw { stations: StationRow[]; airports: AirportRow[] }

export function stationsToLocal(rows: StationRow[], ref: LatLon): NavStation[] {
  return rows.map(r => ({ id: r.id, type: r.type, ident: r.ident, name: r.name, frequency: r.frequency, rangeNm: r.rangeNm, runwayId: r.runwayId, ...toLocal(r, ref) }))
}

export function runwaysToLocal(airports: AirportRow[], ref: LatLon): RunwayInfo[] {
  return airports.flatMap(a => a.runways.map(r => ({
    id: r.id, airportId: a.id, ident: r.ident, headingDeg: r.headingDeg, lengthM: r.lengthM, widthM: r.widthM,
    ...toLocal({ lat: r.thresholdLat, lon: r.thresholdLon }, ref),
  })))
}

export function airportsToLocal(airports: AirportRow[], ref: LatLon): AirportInfo[] {
  return airports.map(a => ({ id: a.id, ident: a.ident, name: a.name, iata: a.iata, type: a.type, elevationFt: a.elevationFt, ...toLocal(a, ref) }))
}

/** Fetches stations (250 NM) and airports with runways (120 NM) around a centre; refetches when it moves. */
export function useNavData(center: Ref<LatLon>) {
  const near = computed(() => `${center.value.lat.toFixed(4)},${center.value.lon.toFixed(4)}`)
  const st = useFetch<StationRow[]>('/api/stations', { query: { near, radiusNm: 250 }, default: () => [], watch: [near] })
  const ap = useFetch<AirportRow[]>('/api/airports', { query: { near, radiusNm: 120, limit: 400 }, default: () => [], watch: [near] })
  const raw = computed<NavDataRaw>(() => ({ stations: st.data.value ?? [], airports: ap.data.value ?? [] }))
  const ready = computed(() => !st.pending.value && !ap.pending.value && (st.data.value?.length ?? 0) > 0)
  return { raw, ready }
}
