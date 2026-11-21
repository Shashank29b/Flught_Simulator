import { computed } from 'vue'
import { toLocal } from '../../shared/utils/geo'
import type { NavStation, RunwayInfo, StationType } from '../../shared/types'

interface StationRow { id: number; type: StationType; ident: string; name: string; frequency: number; lat: number; lon: number; rangeNm: number; runwayId: number | null }
interface RunwayRow { id: number; ident: string; headingDeg: number; thresholdLat: number; thresholdLon: number; lengthM: number; widthM: number }
interface AirportRow { id: number; icao: string; runways: RunwayRow[] }
interface WaypointRow { id: number; ident: string; lat: number; lon: number }

export function stationsToLocal(rows: StationRow[]): NavStation[] {
  return rows.map(r => ({ id: r.id, type: r.type, ident: r.ident, name: r.name, frequency: r.frequency, rangeNm: r.rangeNm, runwayId: r.runwayId, ...toLocal(r) }))
}

export function runwaysToLocal(airports: AirportRow[]): RunwayInfo[] {
  return airports.flatMap(a => a.runways.map(r => ({
    id: r.id, ident: r.ident, headingDeg: r.headingDeg, lengthM: r.lengthM, widthM: r.widthM,
    ...toLocal({ lat: r.thresholdLat, lon: r.thresholdLon }),
  })))
}

export function useNavData() {
  const st = useFetch<StationRow[]>('/api/stations', { key: 'stations', default: () => [] })
  const ap = useFetch<AirportRow[]>('/api/airports', { key: 'airports', default: () => [] })
  const wp = useFetch<WaypointRow[]>('/api/waypoints', { key: 'waypoints', default: () => [] })
  const stations = computed(() => stationsToLocal(st.data.value ?? []))
  const runways = computed(() => runwaysToLocal(ap.data.value ?? []))
  const waypoints = computed(() => (wp.data.value ?? []).map(w => ({ ident: w.ident, ...toLocal(w) })))
  const pending = computed(() => st.pending.value || ap.pending.value)
  return { stations, runways, waypoints, pending }
}
